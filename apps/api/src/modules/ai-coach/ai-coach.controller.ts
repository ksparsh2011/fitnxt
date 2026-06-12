import { Controller, Get } from '@nestjs/common';
import { AiCoachService } from './ai-coach.service';

@Controller('ai-coach')
export class AiCoachController {
  constructor(private readonly aiCoachService: AiCoachService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'ai-coach' };
  }
}
