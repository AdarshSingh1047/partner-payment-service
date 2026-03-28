import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. CREDIT ISSUANCE SERVICE (POST-PAYMENT)
   * Ensures idempotency and atomically issues credits based on an organization's payment.
   */
  async issueCreditsAfterPayment(paymentId: string) {
    if (!paymentId) {
      throw new BadRequestException('Payment ID is strictly required for credit issuance.');
    }

    this.logger.log(`Starting credit issuance for payment ID: ${paymentId}`);

    // Fetch payment by id
    const payment = await (this.prisma as any).payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Ensure payment status = SUCCESS (or SUCCEEDED depending on Prisma enum)
    if (payment.status !== 'SUCCESS' && payment.status !== 'SUCCEEDED') {
      throw new BadRequestException(`Payment ${paymentId} is not successful. Status: ${payment.status}`);
    }

    // Ensure credits are not already issued (Idempotency Check)
    const existingTransaction = await (this.prisma as any).creditTransaction.findFirst({
      where: { 
        metadata: { path: ['paymentId'], equals: paymentId } 
      },
    });

    if (existingTransaction) {
      this.logger.warn(`Credits already issued for payment ID: ${paymentId}`);
      throw new ConflictException(`Credits have already been issued for payment ${paymentId}`);
    }

    // Fetch active CreditPricing based on currency
    const pricing = await (this.prisma as any).creditPricing.findFirst({
      where: { currency: payment.currency, isActive: true },
    });

    if (!pricing) {
      throw new NotFoundException(`Active pricing not found for currency: ${payment.currency}`);
    }

    // Calculate credits
    const creditsToAdd = Math.floor(payment.amount * pricing.creditsPerUnit);

    this.logger.log(`Adding ${creditsToAdd} credits for organization ${payment.organizationId || payment.orgName}`);

    // Use Prisma transaction for atomic updates
    return this.prisma.$transaction(async (tx: any) => {
      const metadata = (payment.metadata as any) || {};
      const orgId = metadata.userId || payment.organizationId || payment.orgName || payment.email;

      // 1. Get current CreditBalance (create if not exists)
      const balanceRecord = await tx.creditBalance.upsert({
        where: { organizationId: orgId },
        update: { balance: { increment: creditsToAdd } },
        create: {
          organizationId: orgId,
          balance: creditsToAdd,
        },
      });

      // 2. Insert CreditTransaction
      const transactionRecord = await tx.creditTransaction.create({
        data: {
          organizationId: orgId,
          amount: creditsToAdd,
          type: 'CREDIT',
          reason: 'Purchased Credits via Payment Link',
          referenceId: payment.id,
          balanceAfter: balanceRecord.balance,
          metadata: {
            paymentId: payment.id,
            providerPaymentId: payment.providerPaymentId || payment.paymentIntentId,
            paidAmount: payment.amount,
            currency: payment.currency,
          },
        },
      });

      this.logger.log(`Successfully issued credits. New balance: ${balanceRecord.balance}`);
      
      return {
        success: true,
        issuedCredits: creditsToAdd,
        newBalance: balanceRecord.balance,
        transactionId: transactionRecord.id,
      };
    });
  }

  /**
   * 2. GET TOTAL CREDITS (Org Wallet)
   */
  async getBalance(organizationId: string) {
    const balanceRecord = await (this.prisma as any).creditBalance.findUnique({
      where: { organizationId },
    });

    return {
      organizationId,
      balance: balanceRecord ? balanceRecord.balance : 0,
    };
  }

  /**
   * 3. GET CREDIT TRANSACTIONS
   */
  async getTransactions(organizationId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      (this.prisma as any).creditTransaction.count({ where: { organizationId } }),
      (this.prisma as any).creditTransaction.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      organizationId,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: transactions,
    };
  }

  /**
   * 4. ADMIN ISSUANCE SERVICE
   * Directly issues an arbitrary amount of credits to an organization without any payment.
   */
  async adminIssueCredits(organizationId: string, creditsToAdd: number, reason?: string) {
    this.logger.log(`Admin issuing ${creditsToAdd} credits to organization ${organizationId}`);

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Upsert CreditBalance
      const balanceRecord = await tx.creditBalance.upsert({
        where: { organizationId },
        update: { balance: { increment: creditsToAdd } },
        create: {
          organizationId,
          balance: creditsToAdd,
        },
      });

      // 2. Insert CreditTransaction
      const transactionRecord = await tx.creditTransaction.create({
        data: {
          organizationId,
          amount: creditsToAdd,
          type: 'ADMIN_CREDIT', // Indicates this was a manual administrative issuance
          balanceAfter: balanceRecord.balance,
          metadata: {
            reason: reason || 'Manual issuance by admin',
            issuedAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Successfully issued admin credits. Org: ${organizationId}, New Balance: ${balanceRecord.balance}`);

      return {
        success: true,
        organizationId,
        issuedCredits: creditsToAdd,
        newBalance: balanceRecord.balance,
        transactionId: transactionRecord.id,
      };
    });
  }
}
