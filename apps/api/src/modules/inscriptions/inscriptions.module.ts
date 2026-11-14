import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { InscriptionsController } from './inscriptions.controller';
import { InscriptionsService } from './inscriptions.service';

@Module({
  imports: [BusinessesModule],
  controllers: [InscriptionsController],
  providers: [InscriptionsService],
})
export class InscriptionsModule {}
