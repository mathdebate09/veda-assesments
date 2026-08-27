import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AnswerRegion } from './answer-region.schema';
import { Question } from './question.schema';
import { AnswerSheet } from './answer-sheet.schema';

export type QuestionGradeDocument = QuestionGrade & Document;

@Schema()
export class QuestionGrade {
  @Prop({
    type: Types.ObjectId,
    ref: AnswerRegion.name,
    required: false,
    default: null,
  })
  answerRegion?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Question.name, required: true })
  question: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: AnswerSheet.name, required: true })
  answerSheet: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  marksAwarded: number;

  @Prop({ required: true, default: 0 })
  maxMarks: number;

  @Prop({ required: true, default: false })
  isCorrect: boolean;

  @Prop({ required: true })
  aiFeedback: string;

  @Prop({ required: false, default: null })
  teacherOverride?: number;

  @Prop({ default: Date.now })
  gradedAt: Date;
}

export const QuestionGradeSchema = SchemaFactory.createForClass(QuestionGrade);
