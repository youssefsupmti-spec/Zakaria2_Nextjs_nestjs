import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './index';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

