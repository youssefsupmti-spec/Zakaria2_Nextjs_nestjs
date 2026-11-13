import { Module } from '@nestjs/common';
import { AgencesController } from './agences.controller';
import { AgencesService } from './agences.service';

@Module({
  controllers: [AgencesController],
  providers: [AgencesService],
  exports: [AgencesService],
})
export class AgencesModule {}
