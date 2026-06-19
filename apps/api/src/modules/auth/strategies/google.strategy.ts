import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { UnverifiedOAuthEmailException } from '../exceptions/auth.exceptions';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') ?? 'unset';
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') ?? 'unset';
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL') ?? 'unset';

    if (clientID === 'unset' || clientSecret === 'unset' || callbackURL === 'unset') {
      GoogleStrategy.logger.warn(
        'Google OAuth is not configured — GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL missing. /auth/google will not work until configured.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException('Google account has no email'), false);
      return;
    }
    // Reject explicitly-unverified emails rather than silently linking/creating an account.
    if (profile.emails?.[0]?.verified === false) {
      done(new UnverifiedOAuthEmailException(), false);
      return;
    }
    done(null, { email, googleSub: profile.id, displayName: profile.displayName ?? email });
  }
}
