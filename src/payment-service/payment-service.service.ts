import { Injectable } from '@nestjs/common';

import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class PaymentService {
  constructor(private readonly stripeService: StripeService) { }

  async createPayment(data: any) {
    // 1. validation
    if (!data.amount) {
      throw new Error('Amount required');
    }

    // 2. business logic
    const finalAmount = data.amount + 10; // tax example

    const paymentLink = await this.stripeService.createPaymentLink(finalAmount);

    // 3. simulate DB save
    return {
      message: 'Payment created',
      paymentLink,
    };
  }
}