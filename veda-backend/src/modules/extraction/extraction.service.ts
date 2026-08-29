import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import { getAiConfig, VisionConfig } from '../../config/ai.config';
import { cleanJsonResponse } from '../../common/utils/ai.helpers';
import { getImageMimeType, isPdfBuffer } from '../../common/utils/document.helpers';
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
  private readonly visionConfig: VisionConfig;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('deepseek.apiKey') ||
      process.env.DEEPSEEK_API_KEY ||
      '';
    const baseURL =
      this.configService.get<string>('deepseek.baseURL') ||
      'https://api.deepseek.com';

    this.visionConfig = this.configService.get<VisionConfig>('ai.vision') ?? getAiConfig().vision;

    this.client = new OpenAI({ apiKey, baseURL });
    this.logger.log(`ExtractionService initialised — model: ${this.visionConfig.model}`);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private bufferToDataUrl(buf: Buffer): string {
    const mime = getImageMimeType(buf);
    return `data:${mime};base64,${buf.toString('base64')}`;
  }

  /**
   * Build DeepSeek Vision content blocks from image sources.
   * Buffers -> DeepSeek Files API (file_id), with inline base64 fallback.
   * URLs -> image_url block directly.
   */
  private async buildImageBlocks(
    imageSources: Array<string | Buffer>,
  ): Promise<Array<any>> {
    const blocks: any[] = [];

    for (let i = 0; i < imageSources.length; i++) {
      const src = imageSources[i];

      if (Buffer.isBuffer(src)) {
        if (isPdfBuffer(src)) {
          throw new BadRequestException(
            'Received an unrasterised PDF buffer. Convert document pages to PNG/JPEG/WebP before extraction.',
          );
        }

        try {
          const mime = getImageMimeType(src);
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
    const imageBlocks = await this.buildImageBlocks(imageSources);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          ...imageBlocks,
        ] as OpenAI.Chat.Completions.ChatCompletionContentPart[] ,
      },
    ];

    const requestPayload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: this.visionConfig.model,
      messages,
      temperature: this.visionConfig.temperature,
      max_tokens: maxTokens,
    };

    this.logger.log(
      `[DeepSeek Vision] request payload: ${JSON.stringify(requestPayload)}`,
    );

    let rawContent = '';
    let rawResponse: any;
    try {
      const response = await this.client.chat.completions.create(requestPayload);
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

    const systemPrompt = this.visionConfig.prompts.extractQuestions;

    const rawContent = await this.runVision(
      systemPrompt,
      imageSources,
      this.visionConfig.questionMaxTokens,
    );

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJsonResponse(rawContent));
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

    const systemPrompt = this.visionConfig.prompts.extractAnswers(questionList);
    this.logger.log(
      `[DeepSeek Vision] answer extraction request: model=${this.visionConfig.model}, questionCount=${questions.length}, pageCount=${imageSources.length}, promptLength=${systemPrompt.length}`,
    );

    let rawContent: string;
    try {
      rawContent = await this.runVision(
        systemPrompt,
        imageSources,
        this.visionConfig.answerMaxTokens,
      );
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
      parsed = JSON.parse(cleanJsonResponse(rawContent));
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
        const rawSegments = Array.isArray(a.segments) ? a.segments : [];
        const segments: AnswerSegmentData[] = rawSegments
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
          .sort((s1, s2) => s1.pageIndex - s2.pageIndex || s1.boundingBox.y - s2.boundingBox.y);

        const validSegments =
          segments.length > 0
            ? segments
            : [
                {
                  pageIndex: 0,
                  boundingBox: validateBoundingBox({ x: 0, y: 0, width: 1, height: 1 }),
                },
              ];

        return {
          questionRef: a.questionRef.trim(),
          text: typeof a.text === 'string' ? a.text.trim() : '',
          segments: validSegments,
        };
      });

    // Helper to normalize strings for flexible matching
    const normalize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Create question lookup set / normalizer
    const validQuestionMap = new Map<string, string>();
    for (const q of questions) {
      validQuestionMap.set(normalize(q.displayId), q.displayId);
      if (q.number) {
        validQuestionMap.set(normalize(q.number), q.displayId);
      }
    }

    const answers: Record<string, ExtractedAnswer> = {};
    const extras: ExtraAnswerData[] = [];

    for (let i = 0; i < answersList.length; i++) {
      const item = answersList[i];
      const normRef = normalize(item.questionRef);
      let matchedDisplayId = validQuestionMap.get(normRef);

      // Try matching by stripping leading 'q', 'ans', 'question', etc.
      if (!matchedDisplayId) {
        const stripped = normRef.replace(/^(ans|sol|question|q|problem|part)/, '');
        matchedDisplayId = validQuestionMap.get(stripped);
      }

      if (matchedDisplayId) {
        // Matched valid question
        const normalizedAnswer: ExtractedAnswer = {
          questionRef: matchedDisplayId,
          text: item.text,
          segments: item.segments,
        };
        // If already present, combine segments and update text
        if (answers[matchedDisplayId]) {
          answers[matchedDisplayId].text += `\n${item.text}`;
          answers[matchedDisplayId].segments.push(...item.segments);
          answers[matchedDisplayId].segments.sort(
            (s1, s2) => s1.pageIndex - s2.pageIndex || s1.boundingBox.y - s2.boundingBox.y,
          );
        } else {
          answers[matchedDisplayId] = normalizedAnswer;
        }
      } else {
        // Fallback: If not explicitly matched, try to assign to the next available question if there's an unattempted one, or save to extras
        const unassignedQ = questions.find((q) => !answers[q.displayId]);
        if (unassignedQ && questions.length === answersList.length) {
          // Exactly matching count -> map directly
          const fallbackDisplayId = unassignedQ.displayId;
          answers[fallbackDisplayId] = {
            questionRef: fallbackDisplayId,
            text: item.text,
            segments: item.segments,
          };
        } else {
          extras.push({
            id: `extra_${i + 1}`,
            questionRef: item.questionRef,
            text: item.text,
            segments: item.segments,
          });
        }
      }
    }

    this.logger.log(
      `Extracted ${Object.keys(answers).length} matched answer(s) and ${extras.length} extra/unmatched block(s).`,
    );

    return { answers, extras, answersList };
  }
}
