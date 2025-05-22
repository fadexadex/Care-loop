import { IsString, IsEmail } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  organizationId: string;

  @IsString()
  invitedById: string;

  token :string 

  slug: string;
}