import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import { validateBoundingBox } from './extraction.helpers';

export interface ExtractedQuestion {
  number: string;
  subPart: string | null;
  displayId: string;
  text: string;
  maxMarks: number | null;
  orderIndex: number;
}

export interface QuestionDistributionItem {
  displayId: string;
  number: string;
  subPart: string | null;
  maxMarks: number | null;
  orderIndex: number;
}

export interface ExtractedHeader {
  subject: string | null;
  className: string | null;
  maxMarks: number | null;
  duration: string | null;
}

export interface ExtractQuestionsResult {
  header: ExtractedHeader;
  questionDistribution: QuestionDistributionItem[];
  questions: Record<string, ExtractedQuestion>;
  questionsList: ExtractedQuestion[];
}

export interface AnswerSegmentData {
  pageIndex: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractedAnswer {
  questionRef: string;
  text: string;
  segments: AnswerSegmentData[];
}

export interface ExtraAnswerData {
  id: string;
  questionRef: string;
  text: string;
  segments: AnswerSegmentData[];
}

export interface ExtractAnswersResult {
  answers: Record<string, ExtractedAnswer>;
  extras: ExtraAnswerData[];
  answersList: ExtractedAnswer[];
}

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private readonly client: OpenAI;

  /** Vision model used for all image extraction tasks */
  private readonly VISION_MODEL = 'deepseek-v4-flash-vision-exp';

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('deepseek.apiKey') ||
      process.env.DEEPSEEK_API_KEY ||
      '';
    const baseURL =
      this.configService.get<string>('deepseek.baseURL') ||
      'https://api.deepseek.com';

    this.client = new OpenAI({ apiKey, baseURL });
    this.logger.log(`ExtractionService initialised — model: ${this.VISION_MODEL}`);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private cleanJson(raw: string): string {
    let s = raw.trim();
    if (s.startsWith('```')) {
      s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    s = s.trim();
    const match = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    return match ? match[0].trim() : s;
  }

  private getImageMimeType(buf: Buffer): string {
    if (buf && buf.length >= 4) {
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
        return 'image/png';
      if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
        return 'image/jpeg';
      if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
        return 'image/gif';
      if (
        buf.length >= 12 &&
        buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
      ) return 'image/webp';
      if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
        throw new BadRequestException(
          'Received an unrasterised PDF buffer. Convert document pages to PNG/JPEG/WebP before extraction.',
        );
      }
    }
    return 'image/png';
  }

  private bufferToDataUrl(buf: Buffer): string {
    const mime = this.getImageMimeType(buf);
    return `data:${mime};base64,${buf.toString('base64')}`;
  }

  /**
   * Build DeepSeek Vision content blocks from image sources.
   * Buffers → DeepSeek Files API (file_id), with inline base64 fallback.
   * URLs   → image_url block directly.
   */
  private async buildImageBlocks(
    imageSources: Array<string | Buffer>,
  ): Promise<Array<any>> {
    const blocks: any[] = [];

    for (let i = 0; i < imageSources.length; i++) {
      const src = imageSources[i];

      if (Buffer.isBuffer(src)) {
        try {
          const mime = this.getImageMimeType(src);
          const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
          const fileObj = await toFile(src, `page_${i + 1}.${ext}`, { type: mime });
          const uploaded = await this.client.files.create({
            file: fileObj,
            purpose: 'user_data' as any,
          });
          if (uploaded?.id) {
            this.logger.log(`Page ${i + 1} uploaded to DeepSeek Files API: ${uploaded.id}`);
            blocks.push({ type: 'file', file_id: uploaded.id });
            continue;
          }
        } catch (err: any) {
          this.logger.warn(
            `DeepSeek Files API upload failed for page ${i + 1} (${err.message}), falling back to inline base64.`,
          );
        }
        // Fallback: inline base64 data URL
        blocks.push({ type: 'image_url', image_url: { url: this.bufferToDataUrl(src) } });

      } else if (typeof src === 'string') {
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
          blocks.push({ type: 'image_url', image_url: { url: src } });
        } else {
          // Bare base64 string
          blocks.push({ type: 'image_url', image_url: { url: `data:image/png;base64,${src}` } });
        }
      }
    }

    return blocks;
  }

  /**
   * Shared DeepSeek Vision invocation.
   */
  private async runVision(
    systemPrompt: string,
    imageSources: Array<string | Buffer>,
    maxTokens: number,
  ): Promise<string> {
    this.logger.log(
      `DeepSeek Vision (${this.VISION_MODEL}) — ${imageSources.length} page(s), max_tokens=${maxTokens}`,
    );

    const imageBlocks = await this.buildImageBlocks(imageSources);

    let rawContent = '';
    let rawResponse: any;
    try {
      const response = await this.client.chat.completions.create({
        model: this.VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              ...imageBlocks,
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: maxTokens,
      });
      rawResponse = response;
      rawContent = response.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`DeepSeek Vision call failed: ${error.message}`, error.stack);
      throw new BadRequestException(`DeepSeek Vision extraction failed: ${error.message}`);
    }

    if (!rawContent.trim()) {
      this.logger.error(
        `DeepSeek Vision returned empty content. ` +
        `finish_reason=${rawResponse?.choices?.[0]?.finish_reason}, ` +
        `usage=${JSON.stringify(rawResponse?.usage)}`,
      );
      throw new BadRequestException(
        'DeepSeek Vision returned an empty response. The document may be illegible or the token budget was exhausted.',
      );
    }

    return rawContent;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Extract all questions from a question paper image set.
   * Uses 15 000 max_tokens (question text is compact structured data).
   */
  /**
   * Extract all questions from a question paper image set.
   * Uses 15 000 max_tokens (question text is compact structured data).
   * Returns:
   *  - header: document metadata (subject, class, maxMarks, duration)
   *  - questionDistribution: ordered list of question keys & marks distribution
   *  - questions: dictionary { [displayId]: QuestionDetails }
   *  - questionsList: ordered array of questions
   */
  async extractQuestionsFromImages(
    imageSources: Array<string | Buffer>,
  ): Promise<ExtractQuestionsResult> {
    if (!imageSources?.length) {
      throw new BadRequestException('No page images provided for extraction.');
    }

    const systemPrompt = `You are a high-speed document OCR and exam paper parser.
Extract all questions from the provided question paper page images.
Output ONLY valid JSON — no markdown, no code fences, no explanations.
Do NOT solve equations, do NOT calculate answers, do NOT debate typos. Transcribe text verbatim.

JSON shape:
{
  "header": {
    "subject": string | null,
    "className": string | null,
    "maxMarks": number | null,
    "duration": string | null
  },
  "questions": [
    {
      "number": string,
      "subPart": string | null,
      "displayId": string,
      "text": string,
      "maxMarks": number | null
    }
  ]
}

Rules:
- "number" is always a string (e.g. "1", "2", "11")
- "subPart" is a single lowercase letter or null (e.g. "a", "b", null)
- "displayId" = number + subPart concatenated (e.g. "1a") or just number when subPart is null
- "text" is the full question text including all instructions and all multiple choice options
- "maxMarks" extracted from the paper if visible (e.g. "[5 marks]", "(5)", "1"), otherwise null
- Preserve the original printed order of questions
- Include ALL questions and ALL labelled sub-parts as separate items`;

    const rawContent = await this.runVision(systemPrompt, imageSources, 15000);

    let parsed: any;
    try {
      parsed = JSON.parse(this.cleanJson(rawContent));
    } catch (err: any) {
      this.logger.error(
        `Failed to parse question extraction JSON: ${err.message}. Raw (first 500): ${rawContent.slice(0, 500)}`,
      );
      throw new BadRequestException(
        'Could not parse the extracted questions. Ensure the question paper is clear and legible.',
      );
    }

    const header: ExtractedHeader = {
      subject: typeof parsed.header?.subject === 'string' ? parsed.header.subject : null,
      className: typeof parsed.header?.className === 'string' ? parsed.header.className : null,
      maxMarks: typeof parsed.header?.maxMarks === 'number' ? parsed.header.maxMarks : null,
      duration: typeof parsed.header?.duration === 'string' ? parsed.header.duration : null,
    };

    const rawQuestions: any[] = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (rawQuestions.length === 0) {
      throw new BadRequestException('No questions were detected. Ensure the document is not blank.');
    }

    const questionsList: ExtractedQuestion[] = rawQuestions.map((q, idx) => {
      const number = String(q.number || idx + 1).trim();
      const subPart =
        typeof q.subPart === 'string' && q.subPart.trim()
          ? q.subPart.trim().toLowerCase()
          : null;
      const displayId =
        typeof q.displayId === 'string' && q.displayId.trim()
          ? q.displayId.trim()
          : subPart ? `${number}${subPart}` : number;
      const text =
        typeof q.text === 'string' && q.text.trim() ? q.text.trim() : 'Question text not found';
      const maxMarks =
        typeof q.maxMarks === 'number' && q.maxMarks > 0 ? q.maxMarks : null;

      return { number, subPart, displayId, text, maxMarks, orderIndex: idx };
    });

    const questionDistribution: QuestionDistributionItem[] = questionsList.map((q) => ({
      displayId: q.displayId,
      number: q.number,
      subPart: q.subPart,
      maxMarks: q.maxMarks,
      orderIndex: q.orderIndex,
    }));

    const questions: Record<string, ExtractedQuestion> = {};
    for (const q of questionsList) {
      questions[q.displayId] = q;
    }

    this.logger.log(`Extracted ${questionsList.length} question(s) into unified distribution.`);
    return { header, questionDistribution, questions, questionsList };
  }

  /**
   * Extract answers from a student answer sheet image set.
   * Uses 50 000 max_tokens (handwritten OCR + bounding boxes across many pages).
   *
   * Returns:
   *  - answers: Record<string, ExtractedAnswer> (dictionary of verified student answers keyed by questionRef)
   *  - extras: ExtraAnswerData[] (unmatched or extra student written answer blocks)
   *  - answersList: ExtractedAnswer[] (combined raw list)
   */
  async extractAnswersFromImages(
    imageSources: Array<string | Buffer>,
    questions: Array<{ displayId: string; text: string; number?: string; subPart?: string | null }>,
  ): Promise<ExtractAnswersResult> {
    if (!imageSources?.length) {
      throw new BadRequestException('No page images provided for answer extraction.');
    }

    const questionList =
      questions.length > 0
        ? questions.map((q) => `- ${q.displayId}: ${q.text}`).join('\n')
        : '(No question list provided — infer question references from what the student wrote)';

    const systemPrompt = `You are a high-speed exam answer sheet OCR parser.
Analyse every page of the student answer sheet and extract every written answer block.
Output ONLY valid JSON — no markdown, no code fences, no explanations.
Do NOT grade or solve the questions. Transcribe the student's handwriting verbatim.

The exam contains these questions:
${questionList}

JSON shape:
{
  "answers": [
    {
      "questionRef": string,
      "text": string,
      "segments": [
        {
          "pageIndex": number,
          "boundingBox": { "x": number, "y": number, "width": number, "height": number }
        }
      ]
    }
  ]
}

Rules:
- "questionRef" must match one of the provided displayIds exactly (e.g. "1a", "2", "11b").
  If the student's label cannot be matched, use the label the student wrote as-is.
- "text" is the complete verbatim transcription. Note strikethroughs as "[crossed out: ...]".
- "segments" must have one entry for EACH page the answer spans (multi-page answers are supported).
- "pageIndex" is 0-based (first page = 0).
- "boundingBox" values are FRACTIONAL (0.0–1.0) relative to the full page dimensions:
    x      = left edge  / page width
    y      = top edge   / page height
    width  = block width  / page width
    height = block height / page height
- Include ALL detected answer blocks, including blank/unattempted ones (text = "").
- Preserve the order in which answers appear on the sheet.`;

    let rawContent: string;
    try {
      rawContent = await this.runVision(systemPrompt, imageSources, 50000);
    } catch (error: any) {
      this.logger.error(`Answer extraction failed: ${error.message}`, error.stack);
      return { answers: {}, extras: [], answersList: [] };
    }

    if (!rawContent.trim()) {
      this.logger.warn('DeepSeek Vision returned empty content for answer extraction.');
      return { answers: {}, extras: [], answersList: [] };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(this.cleanJson(rawContent));
    } catch (err: any) {
      this.logger.error(
        `Failed to parse answer extraction JSON: ${err.message}. Raw (first 500): ${rawContent.slice(0, 500)}`,
      );
      return { answers: {}, extras: [], answersList: [] };
    }

    const rawAnswers: any[] = Array.isArray(parsed.answers) ? parsed.answers : [];

    const answersList: ExtractedAnswer[] = rawAnswers
      .filter((a) => typeof a.questionRef === 'string' && a.questionRef.trim())
      .map((a) => {
        const segments: AnswerSegmentData[] = Array.isArray(a.segments)
          ? a.segments
              .filter(
                (s: any) =>
                  typeof s.pageIndex === 'number' &&
                  s.boundingBox &&
                  typeof s.boundingBox.x === 'number',
              )
              .map((s: any) => ({
                pageIndex: Math.max(0, Math.floor(s.pageIndex)),
                boundingBox: validateBoundingBox({
                  x: s.boundingBox.x,
                  y: s.boundingBox.y,
                  width: s.boundingBox.width,
                  height: s.boundingBox.height,
                }),
              }))
          : [
              {
                pageIndex: 0,
                boundingBox: validateBoundingBox({ x: 0, y: 0, width: 1, height: 1 }),
              },
            ];

        return {
          questionRef: a.questionRef.trim(),
          text: typeof a.text === 'string' ? a.text.trim() : '',
          segments,
        };
      });

    // Create question lookup set / normalizer
    const validQuestionMap = new Map<string, string>();
    for (const q of questions) {
      validQuestionMap.set(q.displayId.toLowerCase().trim(), q.displayId);
      if (q.number) {
        validQuestionMap.set(q.number.toLowerCase().trim(), q.displayId);
      }
    }

    const answers: Record<string, ExtractedAnswer> = {};
    const extras: ExtraAnswerData[] = [];

    for (let i = 0; i < answersList.length; i++) {
      const item = answersList[i];
      const matchedDisplayId = validQuestionMap.get(item.questionRef.toLowerCase().trim());

      if (matchedDisplayId) {
        // Matched valid question
        const normalizedAnswer: ExtractedAnswer = {
          questionRef: matchedDisplayId,
          text: item.text,
          segments: item.segments,
        };
        // If already present, combine segments or update text
        if (answers[matchedDisplayId]) {
          answers[matchedDisplayId].text += `\n${item.text}`;
          answers[matchedDisplayId].segments.push(...item.segments);
        } else {
          answers[matchedDisplayId] = normalizedAnswer;
        }
      } else {
        // Unknown question number -> extras
        extras.push({
          id: `extra_${i + 1}`,
          questionRef: item.questionRef,
          text: item.text,
          segments: item.segments,
        });
      }
    }

    this.logger.log(
      `Extracted ${Object.keys(answers).length} matched answer(s) and ${extras.length} extra/unmatched block(s).`,
    );

    return { answers, extras, answersList };
  }
}
