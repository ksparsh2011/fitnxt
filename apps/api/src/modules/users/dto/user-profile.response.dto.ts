import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UserProfileResponseDto {
  @IsString()
  userId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  avatarUrl!: string | null;

  @IsString()
  fitnessGoal!: string;

  @IsString()
  createdAt!: string;
}
