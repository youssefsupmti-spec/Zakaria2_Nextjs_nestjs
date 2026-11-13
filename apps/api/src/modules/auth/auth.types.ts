import type { AuthUserDto, SessionDuration } from '@zakaria/shared-contracts';

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthContext {
  sessionId: string;
  durationCode: SessionDuration;
  expiresAt: Date;
  user: AuthUserDto;
}

export interface PasswordVerifyResult {
  valid: boolean;
  needsRehash: boolean;
}

