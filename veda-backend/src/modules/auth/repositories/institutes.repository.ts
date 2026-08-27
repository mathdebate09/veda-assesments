import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Institute,
  InstituteDocument,
} from '../../../schemas/institute.schema';

@Injectable()
export class InstitutesRepository {
  constructor(
    @InjectModel(Institute.name)
    private readonly instituteModel: Model<InstituteDocument>,
  ) {}

  async create(data: {
    name: string;
    location: string;
    logoUrl?: string;
  }): Promise<InstituteDocument> {
    const institute = new this.instituteModel(data);
    return institute.save();
  }

  async findById(
    id: string | Types.ObjectId,
  ): Promise<InstituteDocument | null> {
    return this.instituteModel.findById(id).exec();
  }

  async findByName(name: string): Promise<InstituteDocument | null> {
    return this.instituteModel.findOne({ name }).exec();
  }
}
