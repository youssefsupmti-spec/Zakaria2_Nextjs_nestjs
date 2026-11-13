import { Module } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import { DatabaseModule } from '@zakaria/backend-database';
import { LoggerModule } from 'nestjs-pino';
import { AccessControlModule } from '../modules/access-control/access-control.module';
import { AgencesModule } from '../modules/agences/agences.module';
import { AuthModule } from '../modules/auth/auth.module';
import { PartenairesModule } from '../modules/partenaires/partenaires.module';
import { RolesModule } from '../modules/roles/roles.module';
import { SecurityModule } from '../modules/security/security.module';
import { StorageModule } from '../modules/storage/storage.module';
import { UsersModule } from '../modules/users/users.module';
import { HealthController } from './health.controller';

const env = loadBackendEnv();

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-csrf-token"]',
            'req.body.password',
            'req.body.token',
          ],
          remove: true,
        },
        transport:
          env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'HH:MM:ss',
                },
              }
            : undefined,
      },
    }),
    DatabaseModule,
    StorageModule,
    SecurityModule,
    AccessControlModule,
    AuthModule,
    AgencesModule,
    PartenairesModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
