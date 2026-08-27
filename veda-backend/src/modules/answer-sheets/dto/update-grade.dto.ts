import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateGradeDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  marksAwarded: number;
}
