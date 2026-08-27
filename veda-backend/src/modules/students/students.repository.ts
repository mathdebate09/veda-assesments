import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from '../../schemas/student.schema';

@Injectable()
export class StudentsRepository {
  constructor(
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
  ) {}

  async findById(id: string | Types.ObjectId): Promise<StudentDocument | null> {
    return this.studentModel
      .findById(id)
      .populate('classroom')
      .populate('exams')
      .exec();
  }

  async findOne(filter: {
    name: string;
    classroom?: string | Types.ObjectId;
    rollNo?: string;
  }): Promise<StudentDocument | null> {
    const query: any = { name: filter.name };
    if (filter.classroom) {
      query.classroom = new Types.ObjectId(filter.classroom.toString());
    }
    if (filter.rollNo) {
      query.rollNo = filter.rollNo;
    }
    return this.studentModel.findOne(query).exec();
  }

  async create(data: Partial<Student>): Promise<StudentDocument> {
    const student = new this.studentModel(data);
    return student.save();
  }

  async addExam(
    studentId: string | Types.ObjectId,
    examId: string | Types.ObjectId,
  ): Promise<void> {
    await this.studentModel
      .findByIdAndUpdate(studentId, {
        $addToSet: { exams: new Types.ObjectId(examId.toString()) },
      })
      .exec();
  }

  /**
   * Find or create a student by rollNo (serial number).
   * If classroomId is provided it is stored on the student record.
   * The lookup key is rollNo alone — no classroom required.
   */
  async findOrCreate(
    name: string,
    classroomId?: string | Types.ObjectId,
    rollNo?: string,
  ): Promise<StudentDocument> {
    // Primary lookup: by rollNo if provided
    if (rollNo) {
      const existing = await this.studentModel.findOne({ rollNo }).exec();
      if (existing) {
        // Update name if it was previously missing / placeholder
        let changed = false;
        if (name && name !== existing.name) {
          existing.name = name;
          changed = true;
        }
        if (classroomId && !existing.classroom) {
          existing.classroom = new Types.ObjectId(classroomId.toString()) as any;
          changed = true;
        }
        if (changed) await existing.save();
        return existing;
      }
    }

    try {
      const created = new this.studentModel({
        name,
        rollNo: rollNo || undefined,
        classroom: classroomId
          ? new Types.ObjectId(classroomId.toString())
          : undefined,
        exams: [],
        createdAt: new Date(),
      });
      return await created.save();
    } catch (error: any) {
      // Handle race condition on rollNo unique index
      if (error.code === 11000 && rollNo) {
        const found = await this.studentModel.findOne({ rollNo }).exec();
        if (found) return found;
      }
      throw error;
    }
  }
}
