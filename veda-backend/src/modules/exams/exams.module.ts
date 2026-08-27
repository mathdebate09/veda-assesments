import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exam, ExamSchema } from '../../schemas/exam.schema';
import { ExamsRepository } from './exams.repository';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { StorageModule } from '../storage/storage.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Exam.name, schema: ExamSchema }]),
    StorageModule,
    ExtractionModule,
    QuestionsModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsRepository, ExamsService],
  exports: [ExamsRepository, ExamsService],
})
export class ExamsModule {}
