import { IsEmail, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  doctorEmail: string;

  @IsString()
  doctorName: string;

  token: string;

  @IsString()
  organizationId: string;

  @IsString()
  invitedById: string;
}
