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
import { BusinessesService } from './businesses.service';

@ApiTags('Enseignes Commerciales (Business)')
@Controller('businesses')
@UseGuards(SessionAuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste les enseignes commerciales selon le périmètre (client ou agence)',
  })
  list(
    @CurrentAuth() auth: AuthContext,
    @Query('search') search?: string,
    @Query('couverture') couverture?: string,
    @Query('agencyId') agencyId?: string,
    @Query('villeId') villeId?: string,
    @Query('modePaiement') modePaiement?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.businessesService.list(auth.user, {
      search,
      couverture,
      agencyId,
      villeId,
      modePaiement,
      isActive,
    });
  }

  @Post('bulk-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Active ou désactive un lot d’enseignes commerciales' })
  bulkStatus(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.businessesService.bulkUpdateStatus(auth.user, body);
  }

  @Post('bulk-archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive un lot d’enseignes commerciales (administration G4D)' })
  bulkArchive(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.businessesService.bulkArchive(auth.user, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une enseigne commerciale et de ses comptes bancaires' })
  getOne(@CurrentAuth() auth: AuthContext, @Param('id', ParseIntPipe) id: number) {
    return this.businessesService.getOne(auth.user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crée une enseigne commerciale' })
  create(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.businessesService.create(auth.user, body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Met à jour une enseigne commerciale (garde virement bancaire incluse)',
  })
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.businessesService.update(auth.user, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive une enseigne commerciale (administration G4D)' })
  remove(@CurrentAuth() auth: AuthContext, @Param('id', ParseIntPipe) id: number) {
    return this.businessesService.softDelete(auth.user, id);
  }

  @Get(':id/comptes-bancaires')
  @ApiOperation({ summary: 'Liste les comptes bancaires d’une enseigne avec résolution RIB' })
  listComptes(@CurrentAuth() auth: AuthContext, @Param('id', ParseIntPipe) id: number) {
    return this.businessesService.listComptes(auth.user, id);
  }

  @Post(':id/comptes-bancaires')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajoute un compte bancaire (inactif par défaut)' })
  createCompte(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.businessesService.createCompte(auth.user, id, body);
  }

  @Patch(':id/comptes-bancaires/:compteId')
  @ApiOperation({ summary: 'Modifie un compte bancaire d’une enseigne' })
  updateCompte(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('compteId', ParseIntPipe) compteId: number,
    @Body() body: unknown,
  ) {
    return this.businessesService.updateCompte(auth.user, id, compteId, body);
  }

  @Post(':id/comptes-bancaires/:compteId/activer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Active atomiquement un compte bancaire comme compte principal du business',
  })
  activateCompte(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('compteId', ParseIntPipe) compteId: number,
  ) {
    return this.businessesService.activateCompte(auth.user, id, compteId);
  }

  @Delete(':id/comptes-bancaires/:compteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprime un compte bancaire (bloqué si actif et mode virement)' })
  deleteCompte(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('compteId', ParseIntPipe) compteId: number,
  ) {
    return this.businessesService.deleteCompte(auth.user, id, compteId);
  }
}
