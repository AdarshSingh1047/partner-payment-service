import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCreditPricingDto {
  @ApiPropertyOptional({ example: 'USD', description: 'Filter by currency code' })
  @IsOptional()
  @IsString()
  currency?: string;
}
