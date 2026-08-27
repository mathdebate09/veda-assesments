import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExam(
    @Body() dto: CreateExamDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.examsService.createExam(dto, user.userId);
  }

  @Get()
  async getExams(@CurrentUser() user: CurrentUserPayload) {
    return this.examsService.getExamsForTeacher(user.userId);
  }

  @Get(':id')
  async getExamById(@Param('id') id: string) {
    return this.examsService.getExamById(id);
  }

  @Post(':id/question-paper')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max total
      },
    }),
  )
  async uploadQuestionPaper(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.examsService.uploadQuestionPaper(id, files);
  }
}
