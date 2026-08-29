import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EvaluationConfig, getAiConfig, GradingConfig } from '../../config/ai.config';
import { cleanJsonResponse } from '../../common/utils/ai.helpers';

export interface GradeAnswerResult {
  marksAwarded: number;
  isCorrect: boolean;
  aiFeedback: string;
}

export interface ExamSummaryResult {
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
}

export interface SingleGradeItem {
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
  aiFeedback: string;
  teacherOverride: number | null;
}

export interface ExamSummaryData {
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
}

export interface GradeAllExamAnswersResult {
  grades: Record<string, SingleGradeItem>;
  summary: ExamSummaryData;
  totalScore: number;
  maxScore: number;
  percentage: number;
  gradedAt: Date;
}

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);
  private readonly client: OpenAI;
  private readonly gradingConfig: GradingConfig;
  private readonly evalConfig: EvaluationConfig;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('deepseek.apiKey') ||
      process.env.DEEPSEEK_API_KEY ||
      '';
    const baseURL =
      this.configService.get<string>('deepseek.baseURL') ||
      'https://api.deepseek.com';

    this.gradingConfig = this.configService.get<GradingConfig>('ai.grading') ?? getAiConfig().grading;
    this.evalConfig = this.configService.get<EvaluationConfig>('ai.evaluation') ?? getAiConfig().evaluation;

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async gradeAnswer(
    question: { text: string; maxMarks?: number | null },
    studentAnswer: string,
  ): Promise<GradeAnswerResult> {
    const maxMarks =
      question.maxMarks && question.maxMarks > 0 ? question.maxMarks : 5;
    const fallback: GradeAnswerResult = {
      marksAwarded: 0,
      isCorrect: false,
      aiFeedback: 'Could not evaluate answer.',
    };

    if (!studentAnswer || !studentAnswer.trim()) {
      return {
        marksAwarded: 0,
        isCorrect: false,
        aiFeedback: 'No answer was provided for this question.',
      };
    }

    try {
      const systemPrompt = this.gradingConfig.prompts.gradeAnswer;

      const userMessage = `Question: ${question.text}
Maximum Marks: ${maxMarks}
Student Answer: ${studentAnswer}`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      const requestPayload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
        model: this.gradingConfig.model,
        messages,
        max_tokens: this.gradingConfig.maxTokens,
        temperature: this.gradingConfig.temperature,
      };

      this.logger.log(
        `[DeepSeek] gradeAnswer request payload: ${JSON.stringify(requestPayload)}`,
      );

      const response = await this.client.chat.completions.create(requestPayload);

      const rawContent = response.choices[0]?.message?.content || '';
      const cleaned = cleanJsonResponse(rawContent);

      try {
        const parsed = JSON.parse(cleaned);
        let marksAwarded = Number(parsed.marksAwarded);

        if (isNaN(marksAwarded) || marksAwarded < 0) {
          marksAwarded = 0;
        } else if (marksAwarded > maxMarks) {
          marksAwarded = maxMarks;
        }

        const isCorrect =
          typeof parsed.isCorrect === 'boolean'
            ? parsed.isCorrect
            : marksAwarded >= maxMarks * 0.8;

        const aiFeedback =
          typeof parsed.aiFeedback === 'string' && parsed.aiFeedback.trim()
            ? parsed.aiFeedback.trim()
            : 'Answer evaluated.';

        return {
          marksAwarded,
          isCorrect,
          aiFeedback,
        };
      } catch (parseError: any) {
        this.logger.error(
          `Failed to parse DeepSeek grade response: ${parseError.message}. Raw: ${rawContent}`,
        );
        return fallback;
      }
    } catch (error: any) {
      this.logger.error(
        `DeepSeek grading API error: ${error.message}`,
        error.stack,
      );
      return fallback;
    }
  }

  async generateSummary(
    grades: {
      questionText: string;
      marksAwarded: number;
      maxMarks: number;
      aiFeedback: string;
    }[],
  ): Promise<ExamSummaryResult> {
    const fallback: ExamSummaryResult = {
      overallFeedback:
        'Assessment completed. Please review question grades for details.',
      strengths: ['Effort demonstrated across attempted questions'],
      improvements: ['Review topics with lower marks to improve precision'],
    };

    if (!grades || grades.length === 0) {
      return fallback;
    }

    try {
      const systemPrompt = this.evalConfig.prompts.generateSummary;

      const userMessage = `Here are the student's results:
${grades
  .map(
    (g) =>
      `Q: ${g.questionText} | Score: ${g.marksAwarded}/${g.maxMarks} | Feedback: ${g.aiFeedback}`,
  )
  .join('\n')}`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      const requestPayload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
        model: this.evalConfig.model,
        messages,
        max_tokens: this.evalConfig.maxTokens,
        temperature: this.evalConfig.temperature,
      };

      this.logger.log(
        `[DeepSeek] generateSummary request payload: ${JSON.stringify(requestPayload)}`,
      );

      const response = await this.client.chat.completions.create(requestPayload);

      const rawContent = response.choices[0]?.message?.content || '';
      const cleaned = cleanJsonResponse(rawContent);

      try {
        const parsed = JSON.parse(cleaned);
        const overallFeedback =
          typeof parsed.overallFeedback === 'string' &&
          parsed.overallFeedback.trim()
            ? parsed.overallFeedback.trim()
            : fallback.overallFeedback;

        const strengths = Array.isArray(parsed.strengths)
          ? parsed.strengths
              .filter((s: any) => typeof s === 'string' && s.trim())
              .slice(0, 3)
          : fallback.strengths;

        const improvements = Array.isArray(parsed.improvements)
          ? parsed.improvements
              .filter((s: any) => typeof s === 'string' && s.trim())
              .slice(0, 3)
          : fallback.improvements;

        return {
          overallFeedback,
          strengths,
          improvements,
        };
      } catch (parseError: any) {
        this.logger.error(
          `Failed to parse DeepSeek summary response: ${parseError.message}. Raw: ${rawContent}`,
        );
        return fallback;
      }
    } catch (error: any) {
      this.logger.error(
        `DeepSeek summary generation API error: ${error.message}`,
        error.stack,
      );
      return fallback;
    }
  }

  /**
   * Unified grading pipeline: evaluates all questions against student answers
   * and produces a single consolidated grading object with summary and scores.
   */
  async gradeAllExamAnswers(
    questions: Record<string, { displayId?: string; text: string; maxMarks?: number | null }>,
    answers: Record<string, { text: string }>,
  ): Promise<GradeAllExamAnswersResult> {
    const grades: Record<string, SingleGradeItem> = {};
    const summaryInput: Array<{ questionText: string; marksAwarded: number; maxMarks: number; aiFeedback: string }> = [];

    let totalScore = 0;
    let maxScore = 0;

    for (const [key, q] of Object.entries(questions)) {
      const displayId = q.displayId || key;
      const maxMarks = q.maxMarks && q.maxMarks > 0 ? q.maxMarks : 5;
      maxScore += maxMarks;

      const ans = answers[displayId] || answers[key];
      const hasAnswer = Boolean(ans && ans.text && ans.text.trim());

      if (hasAnswer) {
        const gradeRes = await this.gradeAnswer(
          { text: q.text, maxMarks },
          ans.text.trim(),
        );
        grades[displayId] = {
          marksAwarded: gradeRes.marksAwarded,
          maxMarks,
          isCorrect: gradeRes.isCorrect,
          aiFeedback: gradeRes.aiFeedback,
          teacherOverride: null,
        };
        totalScore += gradeRes.marksAwarded;
        summaryInput.push({
          questionText: q.text,
          marksAwarded: gradeRes.marksAwarded,
          maxMarks,
          aiFeedback: gradeRes.aiFeedback,
        });
      } else {
        grades[displayId] = {
          marksAwarded: 0,
          maxMarks,
          isCorrect: false,
          aiFeedback: 'Not attempted.',
          teacherOverride: null,
        };
        summaryInput.push({
          questionText: q.text,
          marksAwarded: 0,
          maxMarks,
          aiFeedback: 'Not attempted.',
        });
      }
    }

    const percentage =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;

    const summaryRes = await this.generateSummary(summaryInput);

    const summary: ExamSummaryData = {
      totalScore,
      maxScore,
      percentage,
      overallFeedback: summaryRes.overallFeedback,
      strengths: summaryRes.strengths,
      improvements: summaryRes.improvements,
    };

    return {
      grades,
      summary,
      totalScore,
      maxScore,
      percentage,
      gradedAt: new Date(),
    };
  }
}
