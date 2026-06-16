import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { PatchOnboardingDto } from './dto/patch-onboarding.dto';
import { PatchProfileDto } from './dto/patch-profile.dto';
import { LeanProfileResponseDto } from './dto/lean-profile.response.dto';
import { UserNotFoundException } from './exceptions/users.exceptions';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /** Returns the full user profile including email, display name, fitness goal, and onboarding status. */
  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const record = await this.usersRepository.findUserWithProfile(userId);
    if (!record) {
      throw new UserNotFoundException(userId);
    }
    const dto = new UserProfileResponseDto();
    dto.userId = record.id;
    dto.email = record.email;
    dto.displayName = record.display_name;
    dto.avatarUrl = null;
    dto.fitnessGoal = record.fitness_goal;
    dto.onboardingCompleted = record.onboarding_completed ?? false;
    dto.createdAt = record.created_at.toISOString();
    return dto;
  }

  /** Saves onboarding data for the user and marks the onboarding flow as completed. */
  async updateOnboarding(
    userId: string,
    dto: PatchOnboardingDto,
  ): Promise<{ onboardingCompleted: boolean }> {
    await this.usersRepository.updateOnboarding(userId, dto);
    return { onboardingCompleted: true };
  }

  /** Returns the lightweight user profile used for display, including session count and member since date. */
  async getLeanProfile(userId: string): Promise<LeanProfileResponseDto> {
    const record = await this.usersRepository.findLeanProfile(userId);
    if (!record) {
      throw new UserNotFoundException(userId);
    }
    const totalSessions = await this.usersRepository.countCompletedSessions(userId);

    const dto = new LeanProfileResponseDto();
    dto.displayName = record.display_name;
    dto.fitnessGoal = record.fitness_goal;
    dto.activityLevel = record.activity_level;
    dto.totalSessions = totalSessions;
    dto.memberSince = record.created_at.toISOString();
    return dto;
  }

  /** Applies the given profile field changes and returns the updated lean profile. */
  async updateProfile(userId: string, dto: PatchProfileDto): Promise<LeanProfileResponseDto> {
    await this.usersRepository.updateProfileFields(userId, dto);
    return this.getLeanProfile(userId);
  }
}
