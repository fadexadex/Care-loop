import { IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateFollowUpDto {

  patientId: string;

  @IsString()
  doctorId: string;

  @IsDateString()
  scheduledAt: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsString()
  visitSummary: string;

  @IsString()
  diagnosis: string;

  @IsString()
  prescription: string;

  @IsString()
  doctorNotes: string;

  @IsString()
  notes: string;

  @IsBoolean()
  @IsOptional()
  criticalFlag?: boolean;
}
