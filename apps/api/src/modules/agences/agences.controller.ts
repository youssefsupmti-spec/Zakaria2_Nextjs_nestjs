import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/auth.decorators';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AgencesService } from './agences.service';

@ApiTags('Agences & Zones')
@Controller('agences')
@UseGuards(SessionAuthGuard)
export class AgencesController {
  constructor(private readonly agencesService: AgencesService) {}

  @Get('zones')
  @ApiOperation({ summary: 'Liste les zones logistiques actives' })
  listZones() {
    return this.agencesService.listZones();
  }

  @Post('zones')
  @ApiOperation({ summary: 'Crée une zone logistique (admin plateforme)' })
  createZone(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.agencesService.createZone(auth.user, body);
  }

  @Get()
  @ApiOperation({ summary: 'Liste les agences accessibles à l’utilisateur connecté' })
  listAgences(@CurrentAuth() auth: AuthContext) {
    return this.agencesService.listAgences(auth.user);
  }

  @Post()
  @ApiOperation({ summary: 'Crée une agence physique G4D (admin plateforme)' })
  createAgence(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.agencesService.createAgence(auth.user, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Met à jour une agence (admin plateforme ou manager D-04)' })
  updateAgence(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.agencesService.updateAgence(auth.user, id, body);
  }

  @Put(':id/zones')
  @ApiOperation({ summary: 'Définit la couverture livraison/ramassage d’une zone par agence' })
  upsertZone(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.agencesService.upsertAgenceZone(auth.user, id, body);
  }

  @Get(':id/membres')
  @ApiOperation({ summary: 'Liste les membres affectés à une agence' })
  listMembres(@CurrentAuth() auth: AuthContext, @Param('id', ParseIntPipe) id: number) {
    return this.agencesService.listAgenceMembres(auth.user, id);
  }

  @Post(':id/membres')
  @ApiOperation({ summary: 'Affecte un utilisateur à une agence avec un rôle dédié' })
  assignMembre(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.agencesService.assignAgenceMembre(auth.user, id, body);
  }

  @Put(':id/membres/:membreId/zones')
  @ApiOperation({ summary: 'Affecte une zone livraison/ramassage à un membre d’agence' })
  assignMembreZone(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('membreId', ParseIntPipe) membreId: number,
    @Body() body: unknown,
  ) {
    return this.agencesService.assignMembreZone(auth.user, id, membreId, body);
  }
}
