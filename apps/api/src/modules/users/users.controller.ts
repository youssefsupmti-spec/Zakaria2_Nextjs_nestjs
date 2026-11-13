import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/decorators/auth.decorators';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Utilisateurs & Sous-comptes')
@Controller('users')
@UseGuards(SessionAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste les utilisateurs accessibles selon la portée multi-organisation',
  })
  listUsers(@CurrentAuth() auth: AuthContext) {
    return this.usersService.listUsers(auth.user);
  }

  @Post()
  @ApiOperation({ summary: 'Crée un utilisateur / sous-compte / livreur local (D-08)' })
  createUser(@CurrentAuth() auth: AuthContext, @Body() body: unknown) {
    return this.usersService.createUser(auth.user, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Met à jour un utilisateur et son rôle (anti-escalade)' })
  updateUser(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.usersService.updateUser(auth.user, id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Active/désactive un compte avec cascade sous-comptes D-06' })
  setStatus(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.usersService.setUserStatus(auth.user, id, body);
  }
}
