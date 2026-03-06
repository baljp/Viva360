import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';
import crypto from 'node:crypto';

export type CheckoutProviderMethod = 'card' | 'pix' | 'direct';

export type HostedCheckoutResult = {
  provider: 'stripe';
  providerRef: string;
  status: 'open' | 'complete' | 'expired';
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required';
  url: string | null;
};

type CreateHostedCheckoutParams = {
  transactionId: string;
  amount: number;
  description: string;
  method: Exclude<CheckoutProviderMethod, 'direct'>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
};

const STRIPE_API_BASE_URL = 'https://api.stripe.com/v1';

const getStripeSecretKey = () => String(process.env.STRIPE_SECRET_KEY || '').trim();
const getStripeWebhookSecret = () => String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();

const isStripeConfigured = () => !!getStripeSecretKey();
const isStripeWebhookConfigured = () => !!getStripeWebhookSecret();

const encodeForm = (payload: Record<string, string | number | boolean | null | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined || value === '') continue;
    params.append(key, String(value));
  }
  return params.toString();
};

const requestStripe = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new AppError('Stripe não configurado neste ambiente.', 503, 'STRIPE_NOT_CONFIGURED');
  }

  const response = await fetch(`${STRIPE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) as Record<string, unknown> : {};
  if (!response.ok) {
    logger.warn('payment_provider.stripe_failed', {
      path,
      status: response.status,
      type: json?.error && typeof json.error === 'object' ? (json.error as Record<string, unknown>).type : null,
      code: json?.error && typeof json.error === 'object' ? (json.error as Record<string, unknown>).code : null,
    });
    throw new AppError('Falha ao comunicar com o provedor de pagamento.', 502, 'STRIPE_REQUEST_FAILED');
  }

  return json as T;
};

export class PaymentProviderService {
  isStripeConfigured() {
    return isStripeConfigured();
  }

  isStripeWebhookConfigured() {
    return isStripeWebhookConfigured();
  }

  verifyStripeWebhookSignature(payload: string, signatureHeader: string) {
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
      throw new AppError('Webhook do Stripe não configurado neste ambiente.', 503, 'STRIPE_WEBHOOK_NOT_CONFIGURED');
    }

    const entries = String(signatureHeader || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const timestamp = entries.find((entry) => entry.startsWith('t='))?.slice(2) || '';
    const expectedSignatures = entries
      .filter((entry) => entry.startsWith('v1='))
      .map((entry) => entry.slice(3))
      .filter(Boolean);

    if (!timestamp || expectedSignatures.length === 0) {
      throw new AppError('Assinatura do webhook inválida.', 400, 'STRIPE_WEBHOOK_SIGNATURE_INVALID');
    }

    const signedPayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    const valid = expectedSignatures.some((signature) => {
      try {
        return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(computedSignature, 'utf8'));
      } catch {
        return false;
      }
    });

    if (!valid) {
      logger.warn('payment_provider.stripe_webhook_signature_invalid');
      throw new AppError('Assinatura do webhook inválida.', 400, 'STRIPE_WEBHOOK_SIGNATURE_INVALID');
    }
  }

  async createHostedCheckout(params: CreateHostedCheckoutParams): Promise<HostedCheckoutResult> {
    const paymentMethodType = params.method === 'pix' ? 'pix' : 'card';
    const unitAmount = Math.round(Number(params.amount || 0) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new AppError('Valor inválido para checkout.', 400, 'INVALID_PAYMENT_AMOUNT');
    }

    const metadataEntries = {
      transactionId: params.transactionId,
      method: params.method,
      ...(params.metadata || {}),
    };

    const body: Record<string, string | number | boolean | null | undefined> = {
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      'payment_method_types[0]': paymentMethodType,
      'line_items[0][quantity]': 1,
      'line_items[0][price_data][currency]': 'brl',
      'line_items[0][price_data][unit_amount]': unitAmount,
      'line_items[0][price_data][product_data][name]': params.description.slice(0, 120),
      customer_email: params.customerEmail || undefined,
      'expires_at': Math.floor((Date.now() + (30 * 60 * 1000)) / 1000),
    };

    let metadataIndex = 0;
    for (const [key, value] of Object.entries(metadataEntries)) {
      body[`metadata[${key}]`] = value;
      body[`payment_intent_data[metadata][${key}]`] = value;
      metadataIndex += 1;
    }
    if (metadataIndex === 0) {
      body['metadata[transactionId]'] = params.transactionId;
      body['payment_intent_data[metadata][transactionId]'] = params.transactionId;
    }

    const session = await requestStripe<{
      id: string;
      url?: string | null;
      status?: 'open' | 'complete' | 'expired';
      payment_status?: 'paid' | 'unpaid' | 'no_payment_required';
    }>('/checkout/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encodeForm(body),
    });

    return {
      provider: 'stripe',
      providerRef: String(session.id),
      status: session.status || 'open',
      paymentStatus: session.payment_status || 'unpaid',
      url: session.url || null,
    };
  }

  async getHostedCheckoutStatus(providerRef: string): Promise<HostedCheckoutResult> {
    const session = await requestStripe<{
      id: string;
      url?: string | null;
      status?: 'open' | 'complete' | 'expired';
      payment_status?: 'paid' | 'unpaid' | 'no_payment_required';
    }>(`/checkout/sessions/${encodeURIComponent(providerRef)}`, {
      method: 'GET',
    });

    return {
      provider: 'stripe',
      providerRef: String(session.id),
      status: session.status || 'open',
      paymentStatus: session.payment_status || 'unpaid',
      url: session.url || null,
    };
  }
}

export const paymentProviderService = new PaymentProviderService();
