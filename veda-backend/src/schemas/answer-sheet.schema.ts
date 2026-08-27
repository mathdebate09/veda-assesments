import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exam } from './exam.schema';
import { Student } from './student.schema';

export type AnswerSheetDocument = AnswerSheet & Document;

export enum AnswerSheetStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  MAPPED = 'mapped',
  GRADED = 'graded',
}

@Schema({ _id: false })
export class BoundingBox {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;
}

export const BoundingBoxSchema = SchemaFactory.createForClass(BoundingBox);

@Schema({ _id: false })
export class AnswerSegment {
  @Prop({ required: true })
  pageIndex: number;

  @Prop({ type: BoundingBoxSchema, required: true })
  boundingBox: BoundingBox;
}

export const AnswerSegmentSchema = SchemaFactory.createForClass(AnswerSegment);

@Schema({ _id: false })
export class AnswerItem {
  @Prop({ required: true })
  questionRef: string;

  @Prop({ required: true, default: '' })
  text: string;

  @Prop({ type: [AnswerSegmentSchema], default: [] })
  segments: AnswerSegment[];
}

export const AnswerItemSchema = SchemaFactory.createForClass(AnswerItem);

@Schema({ _id: false })
export class ExtraAnswerItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  questionRef: string;

  @Prop({ required: true, default: '' })
  text: string;

  @Prop({ type: [AnswerSegmentSchema], default: [] })
  segments: AnswerSegment[];
}

export const ExtraAnswerItemSchema =
  SchemaFactory.createForClass(ExtraAnswerItem);

@Schema({ _id: false })
export class QuestionGradeItem {
  @Prop({ required: true, default: 0 })
  marksAwarded: number;

  @Prop({ required: true, default: 0 })
  maxMarks: number;

  @Prop({ required: true, default: false })
  isCorrect: boolean;

  @Prop({ required: true, default: '' })
  aiFeedback: string;

  @Prop({ type: Number, default: null })
  teacherOverride?: number | null;
}

export const QuestionGradeItemSchema =
  SchemaFactory.createForClass(QuestionGradeItem);

@Schema({ _id: false })
export class ExamSummaryItem {
  @Prop({ required: true, default: 0 })
  totalScore: number;

  @Prop({ required: true, default: 0 })
  maxScore: number;

  @Prop({ required: true, default: 0 })
  percentage: number;

  @Prop({ required: true, default: '' })
  overallFeedback: string;

  @Prop({ type: [String], default: [] })
  strengths: string[];

  @Prop({ type: [String], default: [] })
  improvements: string[];
}

export const ExamSummaryItemSchema =
  SchemaFactory.createForClass(ExamSummaryItem);

@Schema({ _id: false })
export class GradingData {
  @Prop({ type: Object, default: {} })
  grades: Record<string, QuestionGradeItem>;

  @Prop({ type: ExamSummaryItemSchema, required: false })
  summary?: ExamSummaryItem;

  @Prop({ default: Date.now })
  gradedAt: Date;
}

export const GradingDataSchema = SchemaFactory.createForClass(GradingData);

@Schema()
export class AnswerSheet {
  @Prop({ type: Types.ObjectId, ref: Exam.name, required: true })
  exam: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Student.name, required: true })
  student: Types.ObjectId;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true, default: 0 })
  pageCount: number;

  @Prop({ type: [String], default: [] })
  pageImages: string[];

  @Prop({
    required: true,
    enum: AnswerSheetStatus,
    default: AnswerSheetStatus.UPLOADED,
  })
  status: AnswerSheetStatus;

  @Prop({ type: Object, default: {} })
  answers: Record<string, AnswerItem>;

  @Prop({ type: [ExtraAnswerItemSchema], default: [] })
  extras: ExtraAnswerItem[];

  @Prop({ type: GradingDataSchema, required: false })
  grading?: GradingData;

  @Prop({ required: false })
  totalScore?: number;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const AnswerSheetSchema = SchemaFactory.createForClass(AnswerSheet);
