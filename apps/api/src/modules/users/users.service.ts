import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { UserNotFoundException } from './exceptions/users.exceptions';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
    dto.createdAt = record.created_at.toISOString();
    return dto;
  }
}
