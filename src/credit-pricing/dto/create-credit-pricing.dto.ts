import { IsString, IsNumber, IsPositive, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCreditPricingDto {
  @ApiProperty({ example: 'USD', description: 'Currency code (e.g., USD, INR)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ example: 10, description: 'Price amount' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 10000, description: 'Number of credits granted' })
  @IsNumber()
  @IsPositive()
  credits: number;

  @ApiProperty({ example: 10, default: 0, description: 'Minimum purchase amount allowed' })
  @IsNumber()
  @Min(0)
  minPurchase: number;
}
