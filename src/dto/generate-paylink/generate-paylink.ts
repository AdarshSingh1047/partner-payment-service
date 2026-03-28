import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AddressDto {
  @ApiProperty({ example: '123 Tech Park', description: 'Street address line 1' })
  @IsString()
  @IsNotEmpty()
  line1: string;

  @ApiProperty({ example: 'Bengaluru', description: 'City name' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Karnataka', description: 'State or province' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '560001', description: 'Postal/Zip Code' })
  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @ApiProperty({ example: 'IN', description: '2-letter Country Code (ISO 3166-1 alpha-2)' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class GeneratePaylinkDto {
  @ApiProperty({ example: 1000, description: 'Payment amount' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Antigravity solutions', description: 'Organization name' })
  @IsString()
  @IsNotEmpty()
  orgName: string;

  @ApiProperty({ example: 'contact@example.com', description: 'Customer email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: AddressDto, description: 'Customer billing address' })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @ApiPropertyOptional({ example: 'USD', description: 'Optional 3-letter currency code, defaults to USD' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 'user_12345', description: 'Internal Target User ID' })
  @IsString()
  @IsOptional()
  userId?: string;
}