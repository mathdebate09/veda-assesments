import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type ClassroomDocument = Classroom & Document;

@Schema()
export class Classroom {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  standard: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  teacher: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Student' }], default: [] })
  students: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);

ClassroomSchema.index({ teacher: 1, name: 1, subject: 1 }, { unique: true });
