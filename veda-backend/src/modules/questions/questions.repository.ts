import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from '../../schemas/question.schema';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async create(data: Partial<Question>): Promise<QuestionDocument> {
    const question = new this.questionModel(data);
    return question.save();
  }

  async createMany(data: Partial<Question>[]): Promise<QuestionDocument[]> {
    return this.questionModel.insertMany(data) as unknown as Promise<
      QuestionDocument[]
    >;
  }

  async findByExamId(
    examId: string | Types.ObjectId,
  ): Promise<QuestionDocument[]> {
    return this.questionModel
      .find({ exam: new Types.ObjectId(examId.toString()) })
      .sort({ orderIndex: 1 })
      .exec();
  }

  async findById(
    id: string | Types.ObjectId,
  ): Promise<QuestionDocument | null> {
    return this.questionModel.findById(id).exec();
  }

  async deleteByExamId(examId: string | Types.ObjectId): Promise<void> {
    await this.questionModel
      .deleteMany({ exam: new Types.ObjectId(examId.toString()) })
      .exec();
  }
}
