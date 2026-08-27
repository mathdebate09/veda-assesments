import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Classroom, ClassroomSchema } from '../../schemas/classroom.schema';
import { Exam, ExamSchema } from '../../schemas/exam.schema';
import { ClassroomsRepository } from './classrooms.repository';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Classroom.name, schema: ClassroomSchema },
      { name: Exam.name, schema: ExamSchema },
    ]),
  ],
  controllers: [ClassroomsController],
  providers: [ClassroomsRepository, ClassroomsService],
  exports: [ClassroomsRepository, ClassroomsService],
})
export class ClassroomsModule {}
