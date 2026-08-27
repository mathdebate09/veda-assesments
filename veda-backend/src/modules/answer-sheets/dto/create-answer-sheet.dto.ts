import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnswerSheetDto {
  @IsString()
  @IsOptional()
  studentName?: string;

  @IsString()
  @IsNotEmpty()
  studentRollNo: string;
}
