import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PaymentController } from './payment-contoller/payment-contoller.controller';
import { PaymentService } from './payment-service/payment-service.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { StripeService } from './stripe/stripe.service';



@Module({

  imports: [AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    })
  ],
  controllers: [AppController, PaymentController],
  providers: [AppService, PaymentService, PrismaService, StripeService],
})
export class AppModule { }
