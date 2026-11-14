import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/auth.decorators';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { BanquesService } from './banques.service';

@ApiTags('Banques & Codes RIB')
@Controller('banques')
@UseGuards(SessionAuthGuard)
export class BanquesController {
  constructor(private readonly banquesService: BanquesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste les banques et leurs préfixes RIB à 3 chiffres' })
  list(@CurrentAuth() auth: AuthContext, @Query('search') search?: string) {
    return this.banquesService.list(auth.user, search);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crée une banque et ses codes RIB associés' })
  create(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.banquesService.create(auth.user, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Met à jour une banque et ses codes RIB (unicité vérifiée)' })
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.banquesService.update(auth.user, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive une banque (bloqué si des comptes y sont liés)' })
  remove(@CurrentAuth() auth: AuthContext, @Param('id', ParseIntPipe) id: number) {
    return this.banquesService.softDelete(auth.user, id);
  }
}
