import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditPricingDto } from './dto/create-credit-pricing.dto';
import { UpdateCreditPricingDto } from './dto/update-credit-pricing.dto';

@Injectable()
export class CreditPricingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch active credit pricing by currency. 
   * If no currency is provided, returns all active pricing.
   */
  async getActivePricing(currency?: string) {
    const whereClause: any = { isActive: true };
    if (currency) {
      whereClause.currency = currency.toUpperCase();
    }

    const pricings = await (this.prisma as any).creditPricing.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (currency && pricings.length === 0) {
      throw new NotFoundException(`No active pricing found for currency: ${currency}`);
    }

    return pricings;
  }

  /**
   * Admin Only: Create new pricing configuration (Bonus API)
   * Automatically deactivates existing pricing for the same currency.
   */
  async createPricing(dto: CreateCreditPricingDto) {
    const currency = dto.currency.toUpperCase();
    const creditsPerUnit = dto.credits / dto.amount;

    return this.prisma.$transaction(async (tx: any) => {
      // Ensure only one active pricing per currency
      await tx.creditPricing.updateMany({
        where: { currency, isActive: true },
        data: { isActive: false },
      });

      return tx.creditPricing.create({
        data: {
          currency,
          amount: dto.amount,
          credits: dto.credits,
          creditsPerUnit,
          minPurchase: dto.minPurchase,
          isActive: true,
        },
      });
    });
  }

  /**
   * Admin Only: Update pricing config (amount, credits, minPurchase)
   * Automatically recalculates creditsPerUnit and ensures only one active per currency.
   */
  async updatePricing(id: string, dto: UpdateCreditPricingDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one field must be provided to update');
    }

    const existingPricing = await (this.prisma as any).creditPricing.findUnique({
      where: { id },
    });

    if (!existingPricing) {
      throw new NotFoundException(`Credit pricing with ID ${id} not found`);
    }

    // Recalculate based on provided or existing values
    const amount = dto.amount ?? existingPricing.amount;
    const credits = dto.credits ?? existingPricing.credits;
    const creditsPerUnit = credits / amount;

    return this.prisma.$transaction(async (tx: any) => {
      // If the pricing is active, ensure no other active pricing exists for this currency
      if (existingPricing.isActive) {
         await tx.creditPricing.updateMany({
            where: { 
              currency: existingPricing.currency, 
              isActive: true,
              id: { not: id } 
            },
            data: { isActive: false },
         });
      }

      return tx.creditPricing.update({
        where: { id },
        data: {
          amount,
          credits,
          creditsPerUnit,
          minPurchase: dto.minPurchase ?? existingPricing.minPurchase,
        },
      });
    });
  }
}
