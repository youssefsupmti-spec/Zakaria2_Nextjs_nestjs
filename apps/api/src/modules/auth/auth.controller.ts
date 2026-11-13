import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { loadBackendEnv } from '@zakaria/backend-config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthContext, RequestMeta } from './auth.types';
import { AuthService } from './auth.service';
import { CurrentAuth } from './decorators/auth.decorators';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { SessionService } from './session.service';
import { SkipCsrf } from '../security/csrf.guard';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  private readonly env = loadBackendEnv();

  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  private extractMeta(request: FastifyRequest): RequestMeta {
    const forwardedFor = request.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : request.ip;

    const rawUa = request.headers['user-agent'];
    const userAgent = Array.isArray(rawUa) ? rawUa[0] : (rawUa ?? null);

    return {
      ipAddress: rawIp || request.ip || null,
      userAgent,
    };
  }

  private isHttpsRequest(request: FastifyRequest): boolean {
    const forwardedProto = request.headers['x-forwarded-proto'];
    const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    return (
      proto === 'https' ||
      request.protocol === 'https' ||
      this.env.NODE_ENV === 'production' ||
      this.env.AUTH_COOKIE_NAME.startsWith('__Host-')
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const meta = this.extractMeta(request);
    const { response, rawToken, ttlSeconds } = await this.authService.login(body, meta);
    const secure = this.isHttpsRequest(request);

    reply.setCookie(this.env.AUTH_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: ttlSeconds,
    });

    return response;
  }

  @Post('logout')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const meta = this.extractMeta(request);
    const rawToken =
      request.cookies?.[this.env.AUTH_COOKIE_NAME] ??
      request.cookies?.['__Host-g4d.session'] ??
      request.cookies?.['g4d.session'];

    await this.authService.logout(rawToken, meta);

    const secure = this.isHttpsRequest(request);
    for (const cookieName of new Set([
      this.env.AUTH_COOKIE_NAME,
      '__Host-g4d.session',
      'g4d.session',
    ])) {
      reply.clearCookie(cookieName, {
        httpOnly: true,
        secure: cookieName.startsWith('__Host-') ? true : secure,
        sameSite: 'lax',
        path: '/',
      });
    }
    reply.clearCookie('g4d.csrf', {
      httpOnly: false,
      secure,
      sameSite: 'lax',
      path: '/',
    });

    return { ok: true, redirectTo: '/login' };
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Profil connecté, permissions et contexte multi-organisation' })
  me(@CurrentAuth() auth: AuthContext) {
    return {
      user: auth.user,
      sessionExpiresAt: auth.expiresAt.toISOString(),
      sessionDuration: auth.durationCode,
    };
  }

  @Get('sessions')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Liste les sessions actives de l’utilisateur connecté' })
  async listSessions(@CurrentAuth() auth: AuthContext) {
    const sessions = await this.sessionService.listActiveSessions(auth.user.id, auth.sessionId);
    return { sessions };
  }

  @Delete('sessions/:id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoque une session active appartenant à l’utilisateur connecté' })
  async revokeSession(@CurrentAuth() auth: AuthContext, @Param('id') sessionId: string) {
    await this.sessionService.revokeOwnSession(auth.user.id, sessionId);
    return { ok: true };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: unknown, @Req() request: FastifyRequest) {
    return this.authService.requestPasswordReset(body, this.extractMeta(request));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: unknown, @Req() request: FastifyRequest) {
    return this.authService.resetPassword(body, this.extractMeta(request));
  }
}
