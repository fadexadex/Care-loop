import { IsEmail, IsString, Length } from "class-validator";

export class onBoardAdminDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 50)
  password: string;

  @IsString()
  organizationName: string;

  @IsString()
  @Length(10, 15)
  organizationLine: string;
}
