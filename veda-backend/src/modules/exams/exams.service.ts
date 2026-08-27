import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ExamsRepository } from './exams.repository';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamStatus } from '../../schemas/exam.schema';
import { StorageService } from '../storage/storage.service';
import { ExtractionService } from '../extraction/extraction.service';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly examsRepository: ExamsRepository,
    private readonly storageService: StorageService,
    private readonly extractionService: ExtractionService,
    private readonly questionsService: QuestionsService,
  ) {}

  async createExam(dto: CreateExamDto, teacherId: string) {
    const exam = await this.examsRepository.create({
      title: dto.title,
      subject: dto.subject,
      totalMarks: dto.totalMarks || 0,
      teacher: new Types.ObjectId(teacherId),
      status: ExamStatus.DRAFT,
      questionPaperPageImages: [],
      createdAt: new Date(),
    });

    return exam;
  }

  async getExamsForTeacher(teacherId: string) {
    return this.examsRepository.findByTeacher(teacherId);
  }

  async getExamById(id: string) {
    const exam = await this.examsRepository.findById(id);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found.`);
    }

    const legacyQuestions = await this.questionsService.getQuestionsByExam(id);
    const questionsList =
      exam.questionDistribution && exam.questionDistribution.length > 0
        ? exam.questionDistribution.map(
            (qd) =>
              exam.questions?.[qd.displayId] || {
                number: qd.number,
                subPart: qd.subPart,
                displayId: qd.displayId,
                text: '',
                maxMarks: qd.maxMarks,
                orderIndex: qd.orderIndex,
              },
          )
        : legacyQuestions;

    return {
      ...exam.toObject(),
      questions: questionsList,
      questionsMap: exam.questions || {},
      questionDistribution: exam.questionDistribution || [],
    };
  }

  async uploadQuestionPaper(
    examId: string,
    filesInput: Express.Multer.File[] | Express.Multer.File,
  ) {
    const rawFiles = Array.isArray(filesInput)
      ? filesInput
      : [filesInput].filter(Boolean);

    if (!rawFiles || rawFiles.length === 0) {
      throw new BadRequestException('Question paper file is required.');
    }

    const exam = await this.examsRepository.findById(examId);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found.`);
    }

    // Sort page files if they contain page numbers in their names
    const files = [...rawFiles].sort((a, b) => {
      const matchA = a.originalname.match(/page_(\d+)/i);
      const matchB = b.originalname.match(/page_(\d+)/i);
      if (matchA && matchB) {
        return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
      }
      return 0;
    });

    let pageBuffers: Buffer[] = [];
    let originalDocUrl: string | undefined;

    // Check if a single raw PDF was provided
    if (
      files.length === 1 &&
      (files[0].mimetype === 'application/pdf' ||
        files[0].originalname.toLowerCase().endsWith('.pdf'))
    ) {
      const origPath = this.storageService.getQuestionPaperPath(
        examId,
        undefined,
        files[0].originalname,
      );
      originalDocUrl = await this.storageService.uploadFile(
        files[0].buffer,
        origPath,
        files[0].mimetype || 'application/pdf',
      );
      pageBuffers = await this.storageService.rasterisePdfToBuffers(
        files[0].buffer,
        files[0].mimetype || 'application/pdf',
      );
    } else {
      // Stream/array of PNG page images from client side
      pageBuffers = files.map((f) => f.buffer);
    }

    // 1. Upload rasterised page images to Azure inside folder: exams/{examId}/question-paper/page_N.png
    const questionPaperPageImages: string[] = [];
    for (let i = 0; i < pageBuffers.length; i++) {
      const pageBlobPath = this.storageService.getQuestionPaperPath(
        examId,
        i + 1,
      );
      const url = await this.storageService.uploadFile(
        pageBuffers[i],
        pageBlobPath,
        'image/png',
      );
      questionPaperPageImages.push(url);
    }

    const questionPaperUrl =
      originalDocUrl || questionPaperPageImages[0] || '';

    // 2. Extract questions using DeepSeek Vision (Files API / base64)
    const {
      header: extractedHeader,
      questionDistribution,
      questions: questionsMap,
      questionsList,
    } = await this.extractionService.extractQuestionsFromImages(pageBuffers);

    const totalMarks =
      extractedHeader.maxMarks ||
      questionDistribution.reduce((sum, q) => sum + (q.maxMarks || 0), 0) ||
      exam.totalMarks ||
      0;

    // 3. Save updated Exam with unified questionDistribution and questions map
    await this.examsRepository.update(examId, {
      questionPaperUrl,
      questionPaperPageImages,
      totalMarks,
      status: ExamStatus.READY,
      extractedHeader: {
        className: extractedHeader.className,
        standard: extractedHeader.className,
        subject: extractedHeader.subject,
        maxMarks: extractedHeader.maxMarks,
        duration: extractedHeader.duration,
      },
      questionDistribution,
      questions: questionsMap,
    });

    // 4. Save Question documents for backward compatibility
    const legacyQuestions = await this.questionsService.createQuestionsForExam(
      exam._id,
      questionsList,
      totalMarks,
    );

    // 5. Return standardized response
    return [
      {
        type: 'question_paper' as const,
        examId,
        header: extractedHeader,
        questionDistribution,
        questions: questionsMap,
        questionsList: legacyQuestions,
        pageImages: questionPaperPageImages,
      },
    ];
  }
}

