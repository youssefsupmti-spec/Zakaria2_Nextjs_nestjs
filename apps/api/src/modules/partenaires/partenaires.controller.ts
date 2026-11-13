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
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/auth.decorators';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PartenairesService } from './partenaires.service';

@ApiTags('Partenaires B2B & Clés API')
@Controller('partenaires')
@UseGuards(SessionAuthGuard)
export class PartenairesController {
  constructor(private readonly partenairesService: PartenairesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste les partenaires B2B accessibles selon la portée utilisateur' })
  listPartenaires(@CurrentAuth() auth: AuthContext) {
    return this.partenairesService.listPartenaires(auth.user);
  }

  @Post()
  @ApiOperation({ summary: 'Crée une société partenaire B2B (admin plateforme)' })
  createPartenaire(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.partenairesService.createPartenaire(auth.user, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Met à jour une société partenaire B2B' })
  updatePartenaire(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.partenairesService.updatePartenaire(auth.user, id, body);
  }

  @Post(':id/agences')
  @ApiOperation({ summary: 'Lie une agence locale à un partenaire par contrat' })
  assignAgence(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.partenairesService.assignAgenceContract(auth.user, id, body);
  }

  @Post('zones')
  @ApiOperation({ summary: 'Délègue une zone sur un contrat agence-partenaire' })
  assignZone(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.partenairesService.assignPartenaireZone(auth.user, body);
  }

  @Post(':id/coursiers')
  @ApiOperation({ summary: 'Ajoute un coursier rattaché à un partenaire' })
  addCoursier(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.partenairesService.addCoursier(auth.user, id, body);
  }

  @Post(':id/membres')
  @ApiOperation({ summary: 'Rattache un utilisateur portail à un espace partenaire' })
  assignMembre(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.partenairesService.assignPartenaireMembre(auth.user, id, body);
  }

  @Put(':id/connexions')
  @ApiOperation({ summary: 'Enregistre une connexion API sortante chiffrée (AES-256-GCM)' })
  upsertConnexion(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.partenairesService.upsertConnexion(auth.user, id, body);
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Émet une clé API B2B (HMAC-SHA256, interdit sous-comptes D-09)' })
  createApiKey(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.partenairesService.createApiIdentifiant(auth.user, body);
  }

  @Delete('api-keys/:keyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoque une clé API B2B' })
  revokeApiKey(@CurrentAuth() auth: AuthContext, @Param('keyId', ParseIntPipe) keyId: number) {
    return this.partenairesService.revokeApiIdentifiant(auth.user, keyId);
  }
}
