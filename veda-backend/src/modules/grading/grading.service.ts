import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AssessmentConfig, EvaluationConfig, getAiConfig, GradingConfig } from '../../config/ai.config';
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

export interface LearningGapItem {
  topic: string;
  gapPercent: number;
}

export interface AssessmentAnalyticsResult {
  learningGaps: LearningGapItem[];
  teacherInsights: string[];
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
  private readonly assessmentConfig: AssessmentConfig;

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
    this.assessmentConfig = this.configService.get<AssessmentConfig>('ai.assessment') ?? getAiConfig().assessment;

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

  /**
   * Generates real-time Learning Gap Analysis and Teacher Insights for an exam cohort using DeepSeek
   */
  async generateAssessmentAnalytics(
    examTitle: string,
    subject: string,
    questions: Array<{ displayId: string; text: string; maxMarks?: number | null }>,
    studentPerformances: Array<{
      studentName: string;
      percentage: number;
      strengths?: string[];
      improvements?: string[];
      grades?: Record<string, { marksAwarded: number; maxMarks: number; aiFeedback?: string }>;
    }>,
  ): Promise<AssessmentAnalyticsResult> {
    const prompt =
      this.assessmentConfig?.prompts?.analyzeAssessment ||
      getAiConfig().assessment.prompts.analyzeAssessment;

    const qSummary = questions
      .map((q) => `Q${q.displayId}: ${q.text} (Max: ${q.maxMarks || 5} marks)`)
      .join('\n');

    const sSummary = studentPerformances
      .slice(0, 30)
      .map(
        (s) =>
          `- ${s.studentName}: Score ${s.percentage}% | Strengths: ${s.strengths?.join(', ') || 'N/A'} | Areas for improvement: ${s.improvements?.join(', ') || 'N/A'}`,
      )
      .join('\n');

    const userMessage = `Exam: ${examTitle}
Subject: ${subject || 'General'}
Total Students Evaluated: ${studentPerformances.length}

Exam Questions:
${qSummary || 'Questions extracted from paper'}

Student Performances & Evaluation Feedback:
${sSummary || (studentPerformances.length === 0 ? 'No submissions graded yet. Generate preliminary learning gaps and teacher preparation recommendations for this exam syllabus.' : '')}

Please generate the real-time class-wide learning gaps and teacher insights for this exam.`;

    const modelName = this.assessmentConfig?.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    try {
      this.logger.log(`[DeepSeek Assessment] Calling ${modelName} for exam "${examTitle}"...`);
      const response = await this.client.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: this.assessmentConfig?.maxTokens || 4000,
        temperature: this.assessmentConfig?.temperature || 0.3,
      });

      const rawContent = response.choices[0]?.message?.content || '';
      const cleaned = cleanJsonResponse(rawContent);
      const parsed = JSON.parse(cleaned);

      const learningGaps: LearningGapItem[] = Array.isArray(parsed.learningGaps)
        ? parsed.learningGaps
            .filter((g: any) => g && typeof g.topic === 'string' && g.topic.trim())
            .map((g: any) => ({
              topic: g.topic.trim(),
              gapPercent:
                typeof g.gapPercent === 'number'
                  ? Math.min(100, Math.max(1, Math.round(g.gapPercent)))
                  : 15,
            }))
        : [];

      const teacherInsights: string[] = Array.isArray(parsed.teacherInsights)
        ? parsed.teacherInsights.filter((ins: any) => typeof ins === 'string' && ins.trim())
        : [];

      if (learningGaps.length > 0 && teacherInsights.length > 0) {
        return { learningGaps, teacherInsights };
      }
    } catch (err: any) {
      this.logger.warn(`DeepSeek assessment analytics call failed: ${err.message}`);
    }

    // Dynamic contextual fallback based on question text if API call fails
    const dynamicTopics = questions.slice(0, 5).map((q, idx) => {
      const textPreview = q.text.replace(/^[0-9]+[\.\)\s]+/, '').split(/[.?\n]/)[0].trim();
      const topicName = textPreview.length > 3 ? textPreview.slice(0, 45) : `${subject || 'Concept'} Topic ${q.displayId || idx + 1}`;
      return {
        topic: topicName,
        gapPercent: Math.max(5, Math.round(25 - idx * 3.5)),
      };
    });

    return {
      learningGaps: dynamicTopics.length > 0 ? dynamicTopics : [
        { topic: `${subject || 'Core'} Fundamentals`, gapPercent: 20 },
        { topic: `Analytical Question Solving`, gapPercent: 15 },
        { topic: `Standard Problem Application`, gapPercent: 10 },
      ],
      teacherInsights: [
        `Revise fundamental concepts in ${subject || examTitle} – Emphasize step-by-step problem-solving.`,
        `Clarify common misconceptions observed across early question attempts.`,
        `Conduct targeted revision for students needing extra support.`,
        `Encourage active practice with sample questions before the next assessment.`,
      ],
    };
  }
}
