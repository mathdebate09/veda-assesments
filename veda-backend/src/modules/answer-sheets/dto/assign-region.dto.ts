import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignRegionDto {
  @IsMongoId()
  @IsNotEmpty()
  questionId: string;
}
