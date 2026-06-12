import { Controller, Get } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'media' };
  }
}
