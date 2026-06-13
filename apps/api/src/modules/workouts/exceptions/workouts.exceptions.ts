import { NotFoundException, BadRequestException } from '@nestjs/common';

export class SessionNotFoundException extends NotFoundException {
  constructor(sessionId: string) {
    super(`Session ${sessionId} not found`);
  }
}

export class SessionAlreadyActiveException extends BadRequestException {
  constructor() {
    super('A session is already active. Finish it before starting a new one.');
  }
}

export class SessionAlreadyFinishedException extends BadRequestException {
  constructor() {
    super('This session is already finished.');
  }
}
