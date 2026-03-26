import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from '../payment-service/payment-service.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('generate-link')
    createPayment(@Body() data: any) {
        return this.paymentService.createPayment(data);
    }
}