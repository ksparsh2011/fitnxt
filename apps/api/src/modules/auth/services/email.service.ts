import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getResendClient(): Resend | null {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) return null;
    if (!this.resend) {
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  async sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    const resend = this.getResendClient();

    if (!resend) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        // Never log the raw token (or send anything) when misconfigured in production.
        this.logger.error(
          'RESEND_API_KEY is not configured in production — password reset emails cannot be sent.',
        );
        return;
      }
      // Dev-mode fallback — never reaches here with a real API key configured
      this.logger.log(`[EmailService] Password reset link for ${email}: ${resetLink}`);
      return;
    }

    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') ?? 'noreply@fitnxt.app';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your fitNXT password',
      html: `
        <p>We received a request to reset your fitNXT password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }
}
