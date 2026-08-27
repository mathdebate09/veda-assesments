import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema()
export class Student {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true })
  rollNo?: string;

  @Prop({ required: false, trim: true, lowercase: true })
  email?: string;

  @Prop({ type: Types.ObjectId, ref: 'Classroom', required: false })
  classroom?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Exam' }], default: [] })
  exams: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

StudentSchema.index({ rollNo: 1 });
StudentSchema.index({ name: 1, classroom: 1 });
