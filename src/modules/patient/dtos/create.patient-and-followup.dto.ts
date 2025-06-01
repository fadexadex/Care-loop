import { ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePatientDto } from './create.patient.dto';
import { CreateFollowUpDto } from './create.followup.dto';

export class CreatePatientAndFollowupDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePatientDto)
  patient: CreatePatientDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CreateFollowUpDto)
  followUp: CreateFollowUpDto;
}
