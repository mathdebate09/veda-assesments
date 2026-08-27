import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { QuestionsRepository } from './questions.repository';
import { Question, QuestionDocument } from '../../schemas/question.schema';
import { ExtractedQuestion } from '../extraction/extraction.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async createQuestionsForExam(
    examId: string | Types.ObjectId,
    extractedQuestions: ExtractedQuestion[],
    totalExamMarks?: number,
  ): Promise<QuestionDocument[]> {
    if (!extractedQuestions || extractedQuestions.length === 0) {
      return [];
    }

    // Compute a fallback default marks per question in case the paper does not
    // show explicit marks (e.g., a paper that only states total marks on the header)
    const defaultMarks =
      totalExamMarks && extractedQuestions.length > 0
        ? Math.max(1, Math.round(totalExamMarks / extractedQuestions.length))
        : 5;

    const questionsData: Partial<Question>[] = extractedQuestions.map(
      (eq, index) => ({
        exam: new Types.ObjectId(examId.toString()),
        number: eq.number,
        subPart: eq.subPart || null,
        displayId: eq.displayId,
        text: eq.text,
        // Prefer per-question maxMarks extracted from the paper; fall back to default
        maxMarks:
          eq.maxMarks !== null && eq.maxMarks !== undefined && eq.maxMarks > 0
            ? eq.maxMarks
            : defaultMarks,
        orderIndex: eq.orderIndex !== undefined ? eq.orderIndex : index,
        createdAt: new Date(),
      }),
    );

    return this.questionsRepository.createMany(questionsData);
  }


  async getQuestionsByExam(
    examId: string | Types.ObjectId,
  ): Promise<QuestionDocument[]> {
    return this.questionsRepository.findByExamId(examId);
  }

  async getQuestionById(
    id: string | Types.ObjectId,
  ): Promise<QuestionDocument | null> {
    return this.questionsRepository.findById(id);
  }
}
