import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { CsrfService } from './csrf.service';
import { SecurityController } from './security.controller';

@Global()
@Module({
  controllers: [SecurityController],
  providers: [
    CsrfService,
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [CsrfService],
})
export class SecurityModule {}
