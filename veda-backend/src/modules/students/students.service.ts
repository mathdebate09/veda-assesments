import { Injectable } from '@nestjs/common';
import { StudentsRepository } from './students.repository';
import { StudentDocument } from '../../schemas/student.schema';

@Injectable()
export class StudentsService {
  constructor(private readonly studentsRepository: StudentsRepository) {}

  async findOrCreate(
    name: string,
    classroomId?: string,
    rollNo?: string,
  ): Promise<StudentDocument> {
    return this.studentsRepository.findOrCreate(name, classroomId, rollNo);
  }

  async addExam(studentId: string, examId: string): Promise<void> {
    await this.studentsRepository.addExam(studentId, examId);
  }

  async findById(id: string): Promise<StudentDocument | null> {
    return this.studentsRepository.findById(id);
  }
}
