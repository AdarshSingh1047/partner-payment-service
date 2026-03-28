import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class WebhookService {
    private stripe: Stripe;
    constructor(
        private readonly prisma: PrismaService,
        private readonly creditsService: CreditsService
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-03-25.dahlia',
        });
    }

    async handleWebhook(body: any, signature: string) {
        const event = this.stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        );

        // Handle specific event types
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case 'invoice.paid':
                await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return event;
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        console.log('Payment completed:', session.id);

        const address = session.customer_details?.address;
        
        let receiptUrl: string | undefined = undefined;
        if (session.payment_intent && typeof session.payment_intent === 'string') {
            try {
                const pi = await this.stripe.paymentIntents.retrieve(session.payment_intent, {
                    expand: ['latest_charge'],
                });
                receiptUrl = (pi.latest_charge as any)?.receipt_url || undefined;
            } catch (error) {
                console.log('Failed to fetch receipt url', error);
            }
        }

        const paymentRecord = await (this.prisma as any).payment.upsert({
            where: { checkoutSessionId: session.id },
            update: {
                status: 'SUCCEEDED',
                paymentIntentId: session.payment_intent as string,
                providerCustomerId: session.customer as string,
                invoiceId: session.invoice as string,
                receiptUrl,
            },
            create: {
                orgName: session.customer_details?.name || 'Unknown',
                organizationId: (session.metadata as any)?.userId as string || '',
                email: session.customer_details?.email || 'Unknown',
                addressLine1: address?.line1 || '',
                addressLine2: address?.line2,
                city: address?.city || '',
                state: address?.state || '',
                country: address?.country || '',
                postalCode: address?.postal_code || '',
                amount: session.amount_total || 0,
                currency: session.currency?.toUpperCase() || 'USD',
                provider: 'stripe',
                checkoutSessionId: session.id,
                paymentIntentId: session.payment_intent as string,
                invoiceId: session.invoice as string,
                receiptUrl,
                providerCustomerId: session.customer as string,
                status: 'SUCCEEDED',
                metadata: session.metadata as any,
            },
        });

        try {
            await this.creditsService.issueCreditsAfterPayment(paymentRecord.id);
        } catch (error: any) {
            console.log(`Credit issuance skipped/failed for payment ${paymentRecord.id}:`, error.message);
        }
    }

    private async handleInvoicePaid(invoice: Stripe.Invoice) {
        console.log('Invoice paid:', invoice.id);

        // Using type casting to access fields that might be missing in some SDK versions
        const checkoutSessionId = (invoice as any).checkout_session as string;
        const paymentIntentId = (invoice as any).payment_intent as string;

        await (this.prisma as any).payment.updateMany({
            where: {
                OR: [
                    { invoiceId: invoice.id },
                    { checkoutSessionId: checkoutSessionId },
                    { paymentIntentId: paymentIntentId },
                ].filter(condition => Object.values(condition)[0] != null),
            },
            data: {
                status: 'SUCCEEDED',
                invoiceId: invoice.id,
                invoicePdfUrl: invoice.invoice_pdf,
                invoiceHostedUrl: invoice.hosted_invoice_url,
            },
        });

        const payments = await (this.prisma as any).payment.findMany({
            where: {
                OR: [
                    { invoiceId: invoice.id },
                    { checkoutSessionId: checkoutSessionId },
                    { paymentIntentId: paymentIntentId },
                ].filter(condition => Object.values(condition)[0] != null),
            },
        });

        for (const payment of payments) {
            try {
                await this.creditsService.issueCreditsAfterPayment(payment.id);
            } catch (error: any) {
                console.log(`Credit issuance skipped/failed for payment ${payment.id}:`, error.message);
            }
        }
    }
}
