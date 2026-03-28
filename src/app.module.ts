import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PaymentController } from './payment-contoller/payment-contoller.controller';
import { PaymentService } from './payment-service/payment-service.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StripeService } from './stripe/stripe.service';
import { WebhookModule } from './webhook/webhook.module';
import { CreditPricingModule } from './credit-pricing/credit-pricing.module';
import { CreditsModule } from './credits/credits.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    WebhookModule,
    CreditPricingModule,
    CreditsModule,
    PrismaModule,
  ],
  controllers: [AppController, PaymentController],
  providers: [AppService, PaymentService, StripeService],
})
export class AppModule { }
