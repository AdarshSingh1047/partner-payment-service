import { Controller, Post, Body, HttpStatus, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { PaymentService } from '../payment-service/payment-service.service';
import { GeneratePaylinkDto } from '../dto/generate-paylink/generate-paylink';

@ApiTags('Payment (Stripe Links)')
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('generate-link')
    @ApiOperation({ summary: 'Generate a Stripe Payment Link for a customer' })
    @ApiBody({ type: GeneratePaylinkDto })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Returns the generated Stripe payment link URL' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    createPayment(@Body() data: GeneratePaylinkDto) {
        return this.paymentService.createPayment(data);
    }

    @Get('history/:organizationId')
    @ApiOperation({ summary: 'Get billing/payment history for an organization or user' })
    @ApiParam({ name: 'organizationId', description: 'The ID of the organization or user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of all payments' })
    getBillingHistory(@Param('organizationId') organizationId: string) {
        return this.paymentService.getBillingHistory(organizationId);
    }
}