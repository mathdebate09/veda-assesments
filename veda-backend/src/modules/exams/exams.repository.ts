import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from '../../schemas/exam.schema';

@Injectable()
export class ExamsRepository {
  constructor(
    @InjectModel(Exam.name)
    private readonly examModel: Model<ExamDocument>,
  ) {}

  async create(data: Partial<Exam>): Promise<ExamDocument> {
    const exam = new this.examModel(data);
    return exam.save();
  }

  async findByTeacher(
    teacherId: string | Types.ObjectId,
  ): Promise<ExamDocument[]> {
    return this.examModel
      .find({ teacher: new Types.ObjectId(teacherId.toString()) })
      .populate('classroom')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string | Types.ObjectId): Promise<ExamDocument | null> {
    return this.examModel
      .findById(id)
      .populate('classroom')
      .populate('teacher', '-passwordHash')
      .exec();
  }

  async update(
    id: string | Types.ObjectId,
    updateData: Partial<Exam>,
  ): Promise<ExamDocument | null> {
    return this.examModel
      .findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after' })
      .populate('classroom')
      .populate('teacher', '-passwordHash')
      .exec();
  }
}
