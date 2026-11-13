import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { loadBackendEnv } from '@zakaria/backend-config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CSRF_COOKIE_NAME, CsrfService } from './csrf.service';

@ApiTags('Sécurité')
@Controller('security')
export class SecurityController {
  private readonly env = loadBackendEnv();

  constructor(private readonly csrfService: CsrfService) {}

  @Get('csrf')
  @ApiOperation({
    summary: 'Émet ou rafraîchit le jeton CSRF double-submit (g4d.csrf + X-CSRF-Token)',
  })
  issueCsrfToken(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): { csrfToken: string } {
    const existing = request.cookies?.[CSRF_COOKIE_NAME];
    const token = this.csrfService.isValidSignedToken(existing)
      ? existing
      : this.csrfService.generateToken();

    const forwardedProto = request.headers['x-forwarded-proto'];
    const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    const secure =
      proto === 'https' || request.protocol === 'https' || this.env.NODE_ENV === 'production';

    reply.setCookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    reply.header('Cache-Control', 'no-store, private');
    return { csrfToken: token };
  }
}
