import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AnswerSheet } from './answer-sheet.schema';

export type ExamSummaryDocument = ExamSummary & Document;

@Schema()
export class ExamSummary {
  @Prop({ type: Types.ObjectId, ref: AnswerSheet.name, required: true })
  answerSheet: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  totalScore: number;

  @Prop({ required: true, default: 0 })
  maxScore: number;

  @Prop({ required: true, default: 0 })
  percentage: number;

  @Prop({ required: true })
  overallFeedback: string;

  @Prop({ type: [String], default: [] })
  strengths: string[];

  @Prop({ type: [String], default: [] })
  improvements: string[];

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const ExamSummarySchema = SchemaFactory.createForClass(ExamSummary);
