import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassroomsRepository } from './classrooms.repository';
import { ClassroomDocument } from '../../schemas/classroom.schema';

@Injectable()
export class ClassroomsService {
  constructor(private readonly classroomsRepository: ClassroomsRepository) {}

  async findOrCreate(
    teacherId: string,
    className: string,
    standard: string,
    subject: string,
  ): Promise<ClassroomDocument> {
    return this.classroomsRepository.findOrCreate(
      teacherId,
      className,
      standard,
      subject,
    );
  }

  async getClassrooms(teacherId: string): Promise<any[]> {
    return this.classroomsRepository.findByTeacher(teacherId);
  }

  async getClassroomById(id: string, teacherId: string): Promise<any> {
    const classroom = await this.classroomsRepository.findById(id);
    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found.`);
    }

    const classroomTeacherId =
      typeof classroom.teacher === 'object' && (classroom.teacher as any)._id
        ? (classroom.teacher as any)._id.toString()
        : classroom.teacher.toString();

    if (classroomTeacherId !== teacherId) {
      throw new NotFoundException(`Classroom with ID ${id} not found.`);
    }

    const exams = await this.classroomsRepository.findExamsByClassroomId(id);

    const classroomObj = classroom.toObject ? classroom.toObject() : classroom;
    return {
      ...classroomObj,
      exams,
    };
  }

  async getClassroomStudents(id: string, teacherId: string): Promise<any[]> {
    const classroom = await this.getClassroomById(id, teacherId);
    return classroom.students || [];
  }

  async getClassroomExams(id: string, teacherId: string): Promise<any[]> {
    const classroom = await this.getClassroomById(id, teacherId);
    return classroom.exams || [];
  }

  async addStudent(classroomId: string, studentId: string): Promise<void> {
    await this.classroomsRepository.addStudent(classroomId, studentId);
  }
}
