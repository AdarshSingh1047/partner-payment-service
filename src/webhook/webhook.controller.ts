import { Controller, Post, Headers, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhookService } from './webhook.service';

@ApiExcludeController()
@Controller('webhook/stripe')
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) { }

    @Post()
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        console.log('Webhook POST received');
        try {
            const event = await this.webhookService.handleWebhook(req.rawBody, signature);
            return { received: true, event };
        } catch (error) {
            console.error('Webhook error:', error);
            throw error;
        }
    }
}
