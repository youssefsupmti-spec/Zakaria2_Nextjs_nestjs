import { Module } from '@nestjs/common';
import { AgenceRamassageService } from './agence-ramassage.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { InvoiceBankResolverService } from './invoice-bank-resolver.service';

@Module({
  controllers: [BusinessesController],
  providers: [AgenceRamassageService, InvoiceBankResolverService, BusinessesService],
  exports: [AgenceRamassageService, InvoiceBankResolverService],
})
export class BusinessesModule {}
