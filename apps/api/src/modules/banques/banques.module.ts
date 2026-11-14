import { Module } from '@nestjs/common';
import { BanquesController } from './banques.controller';
import { BanquesService } from './banques.service';

@Module({
  controllers: [BanquesController],
  providers: [BanquesService],
})
export class BanquesModule {}
