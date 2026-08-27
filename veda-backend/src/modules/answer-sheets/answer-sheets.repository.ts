import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AnswerSheet,
  AnswerSheetDocument,
} from '../../schemas/answer-sheet.schema';
import {
  AnswerRegion,
  AnswerRegionDocument,
} from '../../schemas/answer-region.schema';
import {
  QuestionGrade,
  QuestionGradeDocument,
} from '../../schemas/question-grade.schema';
import {
  ExamSummary,
  ExamSummaryDocument,
} from '../../schemas/exam-summary.schema';

@Injectable()
export class AnswerSheetsRepository {
  constructor(
    @InjectModel(AnswerSheet.name)
    private readonly answerSheetModel: Model<AnswerSheetDocument>,
    @InjectModel(AnswerRegion.name)
    private readonly answerRegionModel: Model<AnswerRegionDocument>,
    @InjectModel(QuestionGrade.name)
    private readonly questionGradeModel: Model<QuestionGradeDocument>,
    @InjectModel(ExamSummary.name)
    private readonly examSummaryModel: Model<ExamSummaryDocument>,
  ) {}

  // --- AnswerSheet Operations ---
  async createSheet(data: Partial<AnswerSheet>): Promise<AnswerSheetDocument> {
    const sheet = new this.answerSheetModel(data);
    return sheet.save();
  }

  async findSheetById(
    id: string | Types.ObjectId,
  ): Promise<AnswerSheetDocument | null> {
    return this.answerSheetModel
      .findById(id)
      .populate('student')
      .populate('exam')
      .exec();
  }

  async findSheetsByExam(
    examId: string | Types.ObjectId,
  ): Promise<AnswerSheetDocument[]> {
    return this.answerSheetModel
      .find({ exam: new Types.ObjectId(examId.toString()) })
      .populate('student')
      .sort({ uploadedAt: -1 })
      .exec();
  }

  async updateSheet(
    id: string | Types.ObjectId,
    data: Partial<AnswerSheet>,
  ): Promise<AnswerSheetDocument | null> {
    return this.answerSheetModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .populate('student')
      .populate('exam')
      .exec();
  }

  // --- AnswerRegion Operations ---
  async createRegions(
    regions: Partial<AnswerRegion>[],
  ): Promise<AnswerRegionDocument[]> {
    return this.answerRegionModel.insertMany(regions) as unknown as Promise<
      AnswerRegionDocument[]
    >;
  }

  async findRegionsBySheetId(
    sheetId: string | Types.ObjectId,
  ): Promise<AnswerRegionDocument[]> {
    return this.answerRegionModel
      .find({ answerSheet: new Types.ObjectId(sheetId.toString()) })
      .populate('question')
      .exec();
  }

  async findRegionById(
    regionId: string | Types.ObjectId,
  ): Promise<AnswerRegionDocument | null> {
    return this.answerRegionModel
      .findById(regionId)
      .populate('question')
      .exec();
  }

  async updateRegion(
    regionId: string | Types.ObjectId,
    data: Partial<AnswerRegion>,
  ): Promise<AnswerRegionDocument | null> {
    return this.answerRegionModel
      .findByIdAndUpdate(regionId, { $set: data }, { returnDocument: 'after' })
      .populate('question')
      .exec();
  }

  async deleteRegionsBySheetId(
    sheetId: string | Types.ObjectId,
  ): Promise<void> {
    await this.answerRegionModel
      .deleteMany({ answerSheet: new Types.ObjectId(sheetId.toString()) })
      .exec();
  }

  // --- QuestionGrade Operations ---
  async createGrades(
    grades: Partial<QuestionGrade>[],
  ): Promise<QuestionGradeDocument[]> {
    return this.questionGradeModel.insertMany(grades) as unknown as Promise<
      QuestionGradeDocument[]
    >;
  }

  async findGradesBySheetId(
    sheetId: string | Types.ObjectId,
  ): Promise<QuestionGradeDocument[]> {
    return this.questionGradeModel
      .find({ answerSheet: new Types.ObjectId(sheetId.toString()) })
      .populate('question')
      .populate('answerRegion')
      .exec();
  }

  async findGradeById(
    gradeId: string | Types.ObjectId,
  ): Promise<QuestionGradeDocument | null> {
    return this.questionGradeModel
      .findById(gradeId)
      .populate('question')
      .populate('answerRegion')
      .exec();
  }

  async updateGrade(
    gradeId: string | Types.ObjectId,
    data: Partial<QuestionGrade>,
  ): Promise<QuestionGradeDocument | null> {
    return this.questionGradeModel
      .findByIdAndUpdate(gradeId, { $set: data }, { returnDocument: 'after' })
      .populate('question')
      .populate('answerRegion')
      .exec();
  }

  async deleteGradesBySheetId(sheetId: string | Types.ObjectId): Promise<void> {
    await this.questionGradeModel
      .deleteMany({ answerSheet: new Types.ObjectId(sheetId.toString()) })
      .exec();
  }

  // --- ExamSummary Operations ---
  async saveSummary(data: Partial<ExamSummary>): Promise<ExamSummaryDocument> {
    const existing = await this.examSummaryModel
      .findOne({ answerSheet: data.answerSheet })
      .exec();
    if (existing) {
      return this.examSummaryModel
        .findByIdAndUpdate(
          existing._id,
          { $set: data },
          { returnDocument: 'after' },
        )
        .exec() as Promise<ExamSummaryDocument>;
    }
    const summary = new this.examSummaryModel(data);
    return summary.save();
  }

  async findSummaryBySheetId(
    sheetId: string | Types.ObjectId,
  ): Promise<ExamSummaryDocument | null> {
    return this.examSummaryModel
      .findOne({ answerSheet: new Types.ObjectId(sheetId.toString()) })
      .exec();
  }
}
