import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AnswerSheet } from './answer-sheet.schema';
import { Question } from './question.schema';

export type AnswerRegionDocument = AnswerRegion & Document;

@Schema({ _id: false })
export class BoundingBox {
  @Prop({ type: Number, required: true })
  x: number;

  @Prop({ type: Number, required: true })
  y: number;

  @Prop({ type: Number, required: true })
  width: number;

  @Prop({ type: Number, required: true })
  height: number;
}

export const BoundingBoxSchema = SchemaFactory.createForClass(BoundingBox);

@Schema({ _id: false })
export class AnswerSegment {
  @Prop({ type: Number, required: true })
  pageIndex: number;

  @Prop({ type: BoundingBoxSchema, required: true })
  boundingBox: BoundingBox;
}

export const AnswerSegmentSchema = SchemaFactory.createForClass(AnswerSegment);

@Schema()
export class AnswerRegion {
  @Prop({ type: Types.ObjectId, ref: AnswerSheet.name, required: true })
  answerSheet: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Question.name, required: false })
  question?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  questionRef: string;

  @Prop({ required: true })
  extractedText: string;

  @Prop({ required: true, default: false })
  isUnmatched: boolean;

  @Prop({ type: [AnswerSegmentSchema], default: [] })
  segments: AnswerSegment[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AnswerRegionSchema = SchemaFactory.createForClass(AnswerRegion);
