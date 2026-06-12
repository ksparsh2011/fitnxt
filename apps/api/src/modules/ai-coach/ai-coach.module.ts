import { Module } from '@nestjs/common';
import { AiCoachController } from './ai-coach.controller';
import { AiCoachService } from './ai-coach.service';
import { AiCoachRepository } from './ai-coach.repository';

@Module({
  controllers: [AiCoachController],
  providers: [AiCoachService, AiCoachRepository],
  exports: [AiCoachService],
})
export class AiCoachModule {}
