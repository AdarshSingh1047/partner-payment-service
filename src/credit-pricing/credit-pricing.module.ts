import { Module } from '@nestjs/common';
import { CreditPricingController } from './credit-pricing.controller';
import { CreditPricingService } from './credit-pricing.service';

@Module({
  controllers: [CreditPricingController],
  providers: [CreditPricingService],
  exports: [CreditPricingService],
})
export class CreditPricingModule {}
