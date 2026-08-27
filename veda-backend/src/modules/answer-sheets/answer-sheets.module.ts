import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AnswerSheet,
  AnswerSheetSchema,
} from '../../schemas/answer-sheet.schema';
import {
  AnswerRegion,
  AnswerRegionSchema,
} from '../../schemas/answer-region.schema';
import {
  QuestionGrade,
  QuestionGradeSchema,
} from '../../schemas/question-grade.schema';
import {
  ExamSummary,
  ExamSummarySchema,
} from '../../schemas/exam-summary.schema';
import { AnswerSheetsRepository } from './answer-sheets.repository';
import { AnswerSheetsService } from './answer-sheets.service';
import { AnswerSheetsController } from './answer-sheets.controller';
import { StorageModule } from '../storage/storage.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { GradingModule } from '../grading/grading.module';
import { QuestionsModule } from '../questions/questions.module';
import { ExamsModule } from '../exams/exams.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnswerSheet.name, schema: AnswerSheetSchema },
      { name: AnswerRegion.name, schema: AnswerRegionSchema },
      { name: QuestionGrade.name, schema: QuestionGradeSchema },
      { name: ExamSummary.name, schema: ExamSummarySchema },
    ]),
    StorageModule,
    ExtractionModule,
    GradingModule,
    QuestionsModule,
    ExamsModule,
    StudentsModule,
  ],
  controllers: [AnswerSheetsController],
  providers: [AnswerSheetsRepository, AnswerSheetsService],
  exports: [AnswerSheetsRepository, AnswerSheetsService],
})
export class AnswerSheetsModule {}
