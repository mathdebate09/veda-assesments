import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);
  private client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('deepseek.apiKey') ||
      process.env.DEEPSEEK_API_KEY ||
      '';
    const baseURL =
      this.configService.get<string>('deepseek.baseURL') ||
      'https://api.deepseek.com';

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  private cleanJsonString(raw: string): string {
    let clean = raw.trim();
    // Remove markdown code fences if present (```json ... ``` or ``` ...)
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    clean = clean.trim();
    const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      return match[0].trim();
    }
    return clean;
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
      const systemPrompt = `You are a strict but fair school exam evaluator.
Given a question, the student's answer, and the maximum marks available,
evaluate the answer and return a JSON object.
Return ONLY valid JSON. No explanation, no markdown, no code fences.
JSON shape: { marksAwarded: number, isCorrect: boolean, aiFeedback: string }
marksAwarded must be between 0 and maxMarks.
Partial credit is allowed for partially correct answers.
aiFeedback should be 2-3 sentences: what was correct, what was missing.`;

      const userMessage = `Question: ${question.text}
Maximum Marks: ${maxMarks}
Student Answer: ${studentAnswer}`;

      const response = await this.client.chat.completions.create({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 50000,
        temperature: 0.1,
      });

      const rawContent = response.choices[0]?.message?.content || '';
      const cleaned = this.cleanJsonString(rawContent);

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
      } catch (parseError) {
        this.logger.error(
          `Failed to parse DeepSeek grade response: ${parseError.message}. Raw: ${rawContent}`,
        );
        return fallback;
      }
    } catch (error) {
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
      const systemPrompt = `You are a teacher writing an end-of-exam performance report for a student.
Return ONLY valid JSON. No explanation, no markdown, no code fences.
JSON shape: {
  "overallFeedback": string,
  "strengths": string[],
  "improvements": string[]
}`;

      const userMessage = `Here are the student's results:
${grades
  .map(
    (g) =>
      `Q: ${g.questionText} | Score: ${g.marksAwarded}/${g.maxMarks} | Feedback: ${g.aiFeedback}`,
  )
  .join('\n')}`;

      const response = await this.client.chat.completions.create({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 50000,
        temperature: 0.3,
      });

      const rawContent = response.choices[0]?.message?.content || '';
      const cleaned = this.cleanJsonString(rawContent);

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
      } catch (parseError) {
        this.logger.error(
          `Failed to parse DeepSeek summary response: ${parseError.message}. Raw: ${rawContent}`,
        );
        return fallback;
      }
    } catch (error) {
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
  ): Promise<{
    grades: Record<string, { marksAwarded: number; maxMarks: number; isCorrect: boolean; aiFeedback: string; teacherOverride: number | null }>;
    summary: { totalScore: number; maxScore: number; percentage: number; overallFeedback: string; strengths: string[]; improvements: string[] };
    totalScore: number;
    maxScore: number;
    percentage: number;
    gradedAt: Date;
  }> {
    const grades: Record<string, { marksAwarded: number; maxMarks: number; isCorrect: boolean; aiFeedback: string; teacherOverride: number | null }> = {};
    const summaryInput: Array<{ questionText: string; marksAwarded: number; maxMarks: number; aiFeedback: string }> = [];

    let totalScore = 0;
    let maxScore = 0;

    for (const [key, q] of Object.entries(questions)) {
      const displayId = q.displayId || key;
      const maxMarks = q.maxMarks && q.maxMarks > 0 ? q.maxMarks : 5;
      maxScore += maxMarks;

      const ans = answers[displayId] || answers[key];
      if (ans && ans.text && ans.text.trim()) {
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

    const summary = {
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
