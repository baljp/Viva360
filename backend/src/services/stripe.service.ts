import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
      apiVersion: '2025-12-15.clover', // Updated to match installed SDK type definition
      typescript: true,
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'brl') {
    try {
        return await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: {
            enabled: true,
        },
        });
    } catch (e) {
        console.warn("Stripe mock mode: Creating mock intent");
        return {
            id: 'pi_mock_' + Date.now(),
            client_secret: 'pi_mock_secret_' + Date.now(),
            amount: amount * 100,
            currency: 'brl',
            status: 'requires_payment_method'
        };
    }
  }
}

export const stripeService = new StripeService();
