import { IsString, IsEnum, IsInt, IsArray, IsOptional, Length } from 'class-validator';
import { PreferredContactMethod } from '@prisma/client';

export class CreatePatientDto {
  @IsString()
  doctorId: string;

  @IsString()
  name: string;

  @IsString()
  @Length(10, 15)
  phone: string;


  @IsEnum(PreferredContactMethod)
  preferredContactMethod: PreferredContactMethod;

  @IsInt()
  age: number;

  @IsString()
  gender: string;

  @IsString()
  bloodType: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownConditions: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications: string[];
}
