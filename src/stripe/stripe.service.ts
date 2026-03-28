import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { GeneratePaylinkDto } from '../dto/generate-paylink/generate-paylink';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-03-25.dahlia',
        });
    }

    async createPaymentLink(data: GeneratePaylinkDto) {
        // 1. Create a customer to associate with the invoice
        const customer = await this.stripe.customers.create({
            email: data.email,
            name: data.orgName,
            address: {
                line1: data.address.line1,
                city: data.address.city,
                state: data.address.state,
                postal_code: data.address.postal_code,
                country: data.address.country,
            },
        });

        // 2. Create the checkout session with invoice creation enabled
        const session = await this.stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: data.currency || 'USD',
                        product_data: {
                            name: 'Service Payment',
                        },
                        unit_amount: Math.round(data.amount * 100), // convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            invoice_creation: {
                enabled: true,
            },
            metadata: {
                userId: data.userId || 'dummy-user-id-123'
            },
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        });

        return session.url;
    }
}
