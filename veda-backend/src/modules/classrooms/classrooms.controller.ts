import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('classrooms')
@UseGuards(JwtAuthGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Get()
  async getClassrooms(@CurrentUser() user: CurrentUserPayload) {
    return this.classroomsService.getClassrooms(user.userId);
  }

  @Get(':id')
  async getClassroomById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.getClassroomById(id, user.userId);
  }

  @Get(':id/students')
  async getClassroomStudents(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.getClassroomStudents(id, user.userId);
  }

  @Get(':id/exams')
  async getClassroomExams(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.classroomsService.getClassroomExams(id, user.userId);
  }
}
