import { Injectable } from '@nestjs/common';
import { WorkoutsRepository } from './workouts.repository';

@Injectable()
export class WorkoutsService {
  constructor(private readonly workoutsRepository: WorkoutsRepository) {}
}
