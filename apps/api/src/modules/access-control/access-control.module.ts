import { Global, Module } from '@nestjs/common';
import { AccessContextService } from './access-context.service';
import { PolicyService } from './policy.service';

@Global()
@Module({
  providers: [AccessContextService, PolicyService],
  exports: [AccessContextService, PolicyService],
})
export class AccessControlModule {}
