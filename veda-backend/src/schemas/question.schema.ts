import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exam } from './exam.schema';

export type QuestionDocument = Question & Document;

@Schema()
export class Question {
  @Prop({ type: Types.ObjectId, ref: Exam.name, required: true })
  exam: Types.ObjectId;

  @Prop({ required: true, trim: true })
  number: string;

  @Prop({ type: String, required: false, trim: true, default: null })
  subPart?: string | null;

  @Prop({ required: true, trim: true })
  displayId: string;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ type: Number, required: false, default: null })
  maxMarks?: number | null;

  @Prop({ required: true, default: 0 })
  orderIndex: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
