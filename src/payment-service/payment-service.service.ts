import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { StripeService } from '../stripe/stripe.service';
import { GeneratePaylinkDto } from '../dto/generate-paylink/generate-paylink';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) { }

  async createPayment(data: GeneratePaylinkDto) {
    const currency = (data.currency || 'USD').toUpperCase();
    
    // Fetch active credit pricing for the given currency
    const activePricing = await (this.prisma as any).creditPricing.findFirst({
      where: { currency, isActive: true },
    });

    if (!activePricing) {
      throw new NotFoundException(`No active credit pricing found for currency: ${currency}`);
    }

    // Validate minimum purchase amount
    if (data.amount < activePricing.minPurchase) {
      throw new BadRequestException(`Minimum purchase amount is ${activePricing.minPurchase} ${currency}`);
    }

    const finalAmount = data.amount; // Use the provided amount (without hardcoded tax, assume user inputs correctly)

    const paymentLink = await this.stripeService.createPaymentLink({ ...data, amount: finalAmount });
    return {
      message: 'Payment link generated successfully',
      paymentLink,
    };
  }

  async getBillingHistory(organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    
    const history = await (this.prisma as any).payment.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        invoiceHostedUrl: true,
        createdAt: true,
      },
    });

    const formattedHistory = history.map((record: any) => ({
      transactionId: record.id,
      amount: record.amount,
      currency: record.currency,
      status: record.status,
      invoiceUrl: record.invoiceHostedUrl,
      date: record.createdAt,
    }));

    return {
      organizationId,
      history: formattedHistory,
    };
  }
}