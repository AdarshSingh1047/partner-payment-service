import { IsNumber, IsPositive, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCreditPricingDto {
  @ApiPropertyOptional({ example: 15, description: 'Price amount' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ example: 150, description: 'Number of credits granted' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  credits?: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum purchase amount allowed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;
}
