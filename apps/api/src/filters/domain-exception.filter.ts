import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(body);
      return;
    }

    const domainEx = exception as { statusCode?: number; code?: string; message?: string };
    if (typeof domainEx.statusCode === 'number') {
      response.status(domainEx.statusCode).json({
        statusCode: domainEx.statusCode,
        error: { code: domainEx.code ?? 'DOMAIN_ERROR', message: domainEx.message ?? 'An error occurred' },
      });
      return;
    }

    response.status(500).json({ statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
}
