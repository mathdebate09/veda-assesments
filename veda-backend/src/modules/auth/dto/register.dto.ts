import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  instituteName: string;

  @IsString()
  @IsNotEmpty()
  instituteLocation: string;

  @IsUrl()
  @IsOptional()
  instituteLogoUrl?: string;
}
