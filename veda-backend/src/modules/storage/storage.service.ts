import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { pdfToPng } from 'pdf-to-png-converter';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private readonly containerName: string;
  private readonly accountName: string;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>(
      'azure.storage.connectionString',
    );
    this.containerName =
      this.configService.get<string>('azure.storage.container') || 'exam-files';
    this.accountName =
      this.configService.get<string>('azure.storage.accountName') || '';

    if (connectionString) {
      try {
        this.blobServiceClient =
          BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(
          this.containerName,
        );
      } catch (error) {
        this.logger.error(
          `Failed to initialize Azure Blob Storage client: ${error.message}`,
        );
      }
    } else {
      this.logger.warn('Azure Storage Connection String is not defined.');
    }
  }

  generateFilename(prefix: string, originalName: string): string {
    const ext = path.extname(originalName).replace('.', '') || 'bin';
    return `${prefix}_${Date.now()}_${uuidv4()}.${ext}`;
  }

  getQuestionPaperPath(examId: string, pageNumber?: number, originalName?: string): string {
    if (typeof pageNumber === 'number') {
      return `exams/${examId}/question-paper/page_${pageNumber}.png`;
    }
    const ext = originalName ? (path.extname(originalName).replace('.', '') || 'pdf') : 'pdf';
    return `exams/${examId}/question-paper/original_${Date.now()}_${uuidv4()}.${ext}`;
  }

  getAnswerSheetPath(examId: string, studentId: string, pageNumber?: number, originalName?: string): string {
    if (typeof pageNumber === 'number') {
      return `exams/${examId}/answer-sheets/${studentId}/page_${pageNumber}.png`;
    }
    const ext = originalName ? (path.extname(originalName).replace('.', '') || 'pdf') : 'pdf';
    return `exams/${examId}/answer-sheets/${studentId}/original_${Date.now()}_${uuidv4()}.${ext}`;
  }

  private isImageBuffer(buffer: Buffer, mimetype?: string): boolean {
    if (mimetype && mimetype.startsWith('image/')) {
      return true;
    }
    if (buffer && buffer.length >= 4) {
      // PNG
      if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        return true;
      }
      // JPEG
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return true;
      }
      // GIF
      if (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38
      ) {
        return true;
      }
      // WebP
      if (
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      ) {
        return true;
      }
    }
    return false;
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    try {
      if (!this.containerClient) {
        const connectionString = this.configService.get<string>(
          'azure.storage.connectionString',
        );
        if (!connectionString) {
          throw new Error('Azure Storage Connection String not configured');
        }
        this.blobServiceClient =
          BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(
          this.containerName,
        );
      }

      await this.containerClient.createIfNotExists({
        access: 'blob',
      });

      const blockBlobClient = this.containerClient.getBlockBlobClient(filename);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: mimetype,
        },
      });

      if (this.accountName) {
        return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${filename}`;
      }

      return blockBlobClient.url;
    } catch (error) {
      this.logger.error(
        `Azure Blob upload failed for file ${filename}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('File upload failed.');
    }
  }

  async rasterisePdfToBuffers(
    buffer: Buffer,
    mimetype: string = 'application/pdf',
  ): Promise<Buffer[]> {
    if (this.isImageBuffer(buffer, mimetype)) {
      return [buffer];
    }

    try {
      this.logger.log('Rasterising PDF document to PNG images via pdfToPng...');
      const pages = await pdfToPng(buffer, {
        viewportScale: 2.0,
      });

      if (!pages || pages.length === 0) {
        throw new BadRequestException(
          'Could not extract pages from the PDF document. Ensure the PDF is not empty or corrupted.',
        );
      }

      const buffers: Buffer[] = pages
        .map((p) => p.content)
        .filter((b): b is Buffer => Buffer.isBuffer(b));
      this.logger.log(`Successfully rasterised ${buffers.length} PDF pages to PNG.`);
      return buffers;
    } catch (error: any) {
      this.logger.error(
        `Failed to rasterise PDF to buffers: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process and rasterise document pages: ${error.message}`,
      );
    }
  }

  async rasterisePdf(
    buffer: Buffer,
    prefix: string,
    mimetype: string = 'application/pdf',
  ): Promise<string[]> {
    if (this.isImageBuffer(buffer, mimetype)) {
      const filename = this.generateFilename(prefix, 'image.png');
      const url = await this.uploadFile(buffer, filename, mimetype);
      return [url];
    }

    try {
      const pageBuffers = await this.rasterisePdfToBuffers(buffer, mimetype);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < pageBuffers.length; i++) {
        const pageBuffer = pageBuffers[i];
        const pageFilename = `${prefix}_page_${i + 1}_${Date.now()}_${uuidv4()}.png`;
        const url = await this.uploadFile(
          pageBuffer,
          pageFilename,
          'image/png',
        );
        uploadedUrls.push(url);
      }

      return uploadedUrls;
    } catch (error: any) {
      this.logger.error(
        `Failed to rasterise and upload PDF pages: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to process and rasterise document pages.',
      );
    }
  }
}

