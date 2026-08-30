import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AnswerSheetsService } from './answer-sheets.service';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { AssignRegionDto } from './dto/assign-region.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('exams/:examId/answer-sheets')
@UseGuards(JwtAuthGuard)
export class AnswerSheetsController {
  constructor(private readonly answerSheetsService: AnswerSheetsService) {}

  @Get()
  async getAnswerSheets(@Param('examId') examId: string) {
    return this.answerSheetsService.getAnswerSheetsForExam(examId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
  )
  async uploadAnswerSheet(
    @Param('examId') examId: string,
    @Body() dto: CreateAnswerSheetDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.answerSheetsService.createAnswerSheet(examId, dto, files);
  }

  @Post(':id/grade')
  @HttpCode(HttpStatus.OK)
  async gradeAnswerSheet(
    @Param('examId') examId: string,
    @Param('id') id: string,
  ) {
    return this.answerSheetsService.gradeAnswerSheet(examId, id);
  }

  @Get('assessment')
  async getAssessment(@Param('examId') examId: string) {
    return this.answerSheetsService.getExamAssessment(examId);
  }

  @Get(':id')
  async getAnswerSheetDetails(
    @Param('examId') examId: string,
    @Param('id') id: string,
  ) {
    return this.answerSheetsService.getAnswerSheetDetails(examId, id);
  }

  @Patch(':id/grades/:gradeId')
  async updateGrade(
    @Param('examId') examId: string,
    @Param('id') id: string,
    @Param('gradeId') gradeId: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.answerSheetsService.updateGradeOverride(
      examId,
      id,
      gradeId,
      dto.marksAwarded,
    );
  }

  @Patch(':sheetId/regions/:regionId/assign')
  async assignRegion(
    @Param('examId') examId: string,
    @Param('sheetId') sheetId: string,
    @Param('regionId') regionId: string,
    @Body() dto: AssignRegionDto,
  ) {
    return this.answerSheetsService.assignRegionToQuestion(
      examId,
      sheetId,
      regionId,
      dto.questionId,
    );
  }
}

@Controller('exams/:examId/assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private readonly answerSheetsService: AnswerSheetsService) {}

  @Get()
  async getAssessment(@Param('examId') examId: string) {
    return this.answerSheetsService.getExamAssessment(examId);
  }
}

