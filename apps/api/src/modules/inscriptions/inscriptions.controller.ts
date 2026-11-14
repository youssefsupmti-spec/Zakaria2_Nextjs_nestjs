import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthContext, RequestMeta } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/auth.decorators';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { InscriptionsService } from './inscriptions.service';

@ApiTags('Inscriptions Vendeurs')
@Controller('inscriptions')
@UseGuards(SessionAuthGuard)
export class InscriptionsController {
  constructor(private readonly inscriptionsService: InscriptionsService) {}

  private extractMeta(request: FastifyRequest): RequestMeta {
    const forwardedFor = request.headers['x-forwarded-for'];
    const rawIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : request.ip;
    const ua = request.headers['user-agent'];
    return {
      ipAddress: rawIp ?? null,
      userAgent: typeof ua === 'string' ? ua : null,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste les demandes d’inscription vendeurs scopées par agence' })
  list(
    @CurrentAuth() auth: AuthContext,
    @Query('statut') statut?: string,
    @Query('search') search?: string,
  ) {
    return this.inscriptionsService.list(auth.user, { statut, search });
  }

  @Post(':id/accepter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accepte une demande d’inscription en attente (FOR UPDATE)' })
  accepter(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Req() request: FastifyRequest,
  ) {
    return this.inscriptionsService.accepter(auth.user, id, this.extractMeta(request));
  }

  @Post('bulk-accepter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accepte un lot de demandes d’inscription en attente' })
  bulkAccepter(
    @CurrentAuth() auth: AuthContext,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ) {
    return this.inscriptionsService.bulkAccepter(auth.user, body, this.extractMeta(request));
  }

  @Post(':id/refuser')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refuse une demande d’inscription avec motif obligatoire (FOR UPDATE)' })
  refuser(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ) {
    return this.inscriptionsService.refuser(auth.user, id, body, this.extractMeta(request));
  }
}
