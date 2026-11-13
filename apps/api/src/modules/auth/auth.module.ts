import { Global, Module } from '@nestjs/common';
import { AuthAuditService } from './auth-audit.service';
import { AuthController } from './auth.controller';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { MailQueueService } from './mail-queue.service';
import { PasswordHasherService } from './password-hasher.service';
import { PermissionResolverService } from './permission-resolver.service';
import { SessionService } from './session.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    PasswordHasherService,
    AuthRateLimitService,
    AuthAuditService,
    PermissionResolverService,
    SessionService,
    MailQueueService,
    AuthService,
    SessionAuthGuard,
    PermissionsGuard,
  ],
  exports: [
    PermissionResolverService,
    SessionService,
    SessionAuthGuard,
    PermissionsGuard,
    PasswordHasherService,
  ],
})
export class AuthModule {}
