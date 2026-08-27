import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InstituteDocument = Institute & Document;

@Schema({ timestamps: true })
export class Institute {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true })
  logoUrl?: string;

  @Prop({ required: true, trim: true })
  location: string;
}

export const InstituteSchema = SchemaFactory.createForClass(Institute);
