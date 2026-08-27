import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Classroom, ClassroomDocument } from '../../schemas/classroom.schema';
import { Exam, ExamDocument } from '../../schemas/exam.schema';

@Injectable()
export class ClassroomsRepository {
  constructor(
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
    @InjectModel(Exam.name)
    private readonly examModel: Model<ExamDocument>,
  ) {}

  async findById(
    id: string | Types.ObjectId,
  ): Promise<ClassroomDocument | null> {
    return this.classroomModel
      .findById(id)
      .populate('students')
      .populate('teacher', '-passwordHash')
      .exec();
  }

  async findByTeacher(teacherId: string | Types.ObjectId): Promise<any[]> {
    const teacherObjId = new Types.ObjectId(teacherId.toString());
    const classrooms = await this.classroomModel
      .find({ teacher: teacherObjId })
      .populate('students')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Attach examCount and studentCount for each classroom
    const classroomIds = classrooms.map((c) => c._id);
    const examCounts = await this.examModel.aggregate([
      { $match: { classroom: { $in: classroomIds } } },
      { $group: { _id: '$classroom', count: { $sum: 1 } } },
    ]);

    const examCountMap = new Map<string, number>(
      examCounts.map((e) => [e._id.toString(), e.count]),
    );

    return classrooms.map((c) => ({
      ...c,
      studentCount: c.students ? c.students.length : 0,
      examCount: examCountMap.get(c._id.toString()) || 0,
    }));
  }

  async findOne(filter: {
    teacher: string | Types.ObjectId;
    name: string;
    subject: string;
  }): Promise<ClassroomDocument | null> {
    return this.classroomModel
      .findOne({
        teacher: new Types.ObjectId(filter.teacher.toString()),
        name: filter.name,
        subject: filter.subject,
      })
      .exec();
  }

  async create(data: Partial<Classroom>): Promise<ClassroomDocument> {
    const classroom = new this.classroomModel(data);
    return classroom.save();
  }

  async addStudent(
    classroomId: string | Types.ObjectId,
    studentId: string | Types.ObjectId,
  ): Promise<void> {
    await this.classroomModel
      .findByIdAndUpdate(classroomId, {
        $addToSet: { students: new Types.ObjectId(studentId.toString()) },
      })
      .exec();
  }

  async findOrCreate(
    teacherId: string | Types.ObjectId,
    name: string,
    standard: string,
    subject: string,
  ): Promise<ClassroomDocument> {
    const teacherObjId = new Types.ObjectId(teacherId.toString());
    const existing = await this.classroomModel
      .findOne({
        teacher: teacherObjId,
        name,
        subject,
      })
      .exec();

    if (existing) {
      return existing;
    }

    try {
      const created = new this.classroomModel({
        teacher: teacherObjId,
        name,
        standard,
        subject,
        students: [],
        createdAt: new Date(),
      });
      return await created.save();
    } catch (error: any) {
      // Handle potential race condition unique index conflict
      if (error.code === 11000) {
        const found = await this.classroomModel
          .findOne({
            teacher: teacherObjId,
            name,
            subject,
          })
          .exec();
        if (found) return found;
      }
      throw error;
    }
  }

  async findExamsByClassroomId(
    classroomId: string | Types.ObjectId,
  ): Promise<ExamDocument[]> {
    return this.examModel
      .find({ classroom: new Types.ObjectId(classroomId.toString()) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
