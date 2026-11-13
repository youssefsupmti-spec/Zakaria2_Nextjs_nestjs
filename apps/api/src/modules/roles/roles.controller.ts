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
import { RolesService } from './roles.service';

@ApiTags('Rôles & Permissions RBAC')
@Controller('roles')
@UseGuards(SessionAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @ApiOperation({ summary: 'Catalogue des permissions attribuables par l’acteur (anti-escalade)' })
  listPermissions(@CurrentAuth() auth: AuthContext, @Query('portee') portee?: string) {
    return this.rolesService.listAvailablePermissions(auth.user, portee);
  }

  @Get()
  @ApiOperation({ summary: 'Liste les rôles accessibles selon la portée multi-organisation' })
  listRoles(@CurrentAuth() auth: AuthContext) {
    return this.rolesService.listRoles(auth.user);
  }

  @Post()
  @ApiOperation({ summary: 'Crée un rôle personnalisé borné avec contrôle anti-escalade' })
  createRole(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.rolesService.createRole(auth.user, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Met à jour un rôle personnalisé et invalide les caches Redis' })
  updateRole(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.rolesService.updateRole(auth.user, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprime un rôle personnalisé non système et non utilisé' })
  deleteRole(@CurrentAuth() auth: AuthContext, @Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(auth.user, id);
  }
}
