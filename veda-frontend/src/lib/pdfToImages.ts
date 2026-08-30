import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Checks whether a given file is a PDF.
 */
export function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

/**
 * Converts a PDF file into a stream of PNG File objects.
 * Uses 2.0x scale for crisp OCR and vision model extraction.
 */
export async function* convertPdfToPngStream(
  file: File,
  onProgress?: (current: number, total: number) => void,
): AsyncGenerator<File, void, unknown> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    // 2.0x viewport scale gives ~150-200 DPI clarity
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Failed to create canvas 2D rendering context');
    }

    // White background to handle any transparent PDFs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to convert PDF page ${pageNum} to PNG blob.`));
      }, 'image/png');
    });

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const pageFile = new File(
      [blob],
      `${baseName}_page_${pageNum}.png`,
      { type: 'image/png' },
    );

    if (onProgress) {
      onProgress(pageNum, numPages);
    }

    yield pageFile;
  }
}

/**
 * Converts a file (PDF or Image) into an array of PNG Files.
 * If the file is already an image, it is returned directly as a 1-element array.
 */
export async function convertFileToPngList(
  file: File,
  onProgress?: (statusMessage: string) => void,
): Promise<File[]> {
  if (!isPdfFile(file)) {
    return [file];
  }

  const pngFiles: File[] = [];
  onProgress?.('Preparing PDF for conversion…');

  for await (const pageFile of convertPdfToPngStream(file, (current, total) => {
    onProgress?.(`Converting PDF page ${current} of ${total} to PNG…`);
  })) {
    pngFiles.push(pageFile);
  }

  return pngFiles;
}
