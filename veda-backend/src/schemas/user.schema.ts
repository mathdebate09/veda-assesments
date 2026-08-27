import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Institute } from './institute.schema';

export type UserDocument = User & Document;

export enum UserRole {
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Schema()
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.TEACHER })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: Institute.name, required: true })
  institute: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
