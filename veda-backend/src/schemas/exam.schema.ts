import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Classroom } from './classroom.schema';
import { User } from './user.schema';

export type ExamDocument = Exam & Document;

export enum ExamStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  READY = 'ready',
  GRADED = 'graded',
}

@Schema({ _id: false })
export class ExtractedHeader {
  @Prop({ type: String, required: false, default: null })
  className: string | null;

  @Prop({ type: String, required: false, default: null })
  standard: string | null;

  @Prop({ type: String, required: false, default: null })
  subject: string | null;

  @Prop({ type: Number, required: false, default: null })
  maxMarks: number | null;

  @Prop({ type: String, required: false, default: null })
  duration: string | null;
}

export const ExtractedHeaderSchema =
  SchemaFactory.createForClass(ExtractedHeader);

@Schema({ _id: false })
export class QuestionDistributionItem {
  @Prop({ required: true })
  displayId: string;

  @Prop({ required: true })
  number: string;

  @Prop({ type: String, default: null })
  subPart: string | null;

  @Prop({ type: Number, default: null })
  maxMarks: number | null;

  @Prop({ required: true, default: 0 })
  orderIndex: number;
}

export const QuestionDistributionItemSchema =
  SchemaFactory.createForClass(QuestionDistributionItem);

@Schema({ _id: false })
export class QuestionItem {
  @Prop({ required: true })
  number: string;

  @Prop({ type: String, default: null })
  subPart: string | null;

  @Prop({ required: true })
  displayId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: Number, default: null })
  maxMarks: number | null;

  @Prop({ required: true, default: 0 })
  orderIndex: number;
}

export const QuestionItemSchema =
  SchemaFactory.createForClass(QuestionItem);

@Schema()
export class Exam {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: false, trim: true })
  subject?: string;

  @Prop({ required: true, default: 0 })
  totalMarks: number;

  @Prop({ type: Types.ObjectId, ref: Classroom.name, required: false })
  classroom?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  teacher: Types.ObjectId;

  @Prop({ required: false })
  questionPaperUrl?: string;

  @Prop({ type: [String], default: [] })
  questionPaperPageImages: string[];

  @Prop({ required: true, enum: ExamStatus, default: ExamStatus.DRAFT })
  status: ExamStatus;

  @Prop({ type: ExtractedHeaderSchema, required: false })
  extractedHeader?: ExtractedHeader;

  @Prop({ type: [QuestionDistributionItemSchema], default: [] })
  questionDistribution: QuestionDistributionItem[];

  @Prop({ type: Object, default: {} })
  questions: Record<string, QuestionItem>;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
