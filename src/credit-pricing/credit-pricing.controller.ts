import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreditPricingService } from './credit-pricing.service';
import { CreateCreditPricingDto } from './dto/create-credit-pricing.dto';
import { UpdateCreditPricingDto } from './dto/update-credit-pricing.dto';
import { GetCreditPricingDto } from './dto/get-credit-pricing.dto';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Credit Pricing')
@Controller('credit-pricing')
export class CreditPricingController {
  constructor(private readonly pricingService: CreditPricingService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch active credit pricing configuration' })
  @ApiQuery({ name: 'currency', required: false, description: 'Optional currency filter (e.g., USD, INR)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns active credit pricing policies' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pricing not found for specific currency' })
  async getActivePricing(@Query() query: GetCreditPricingDto) {
    return this.pricingService.getActivePricing(query.currency);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new credit pricing config (Admin Only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The newly created pricing policy' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed' })
  async createPricing(@Body() dto: CreateCreditPricingDto) {
    return this.pricingService.createPricing(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update pricing config and recalculate creditsPerUnit (Admin Only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The updated pricing policy' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pricing policy not found' })
  async updatePricing(
    @Param('id') id: string,
    @Body() dto: UpdateCreditPricingDto,
  ) {
    return this.pricingService.updatePricing(id, dto);
  }
}
