import { logger } from '../lib/logger';

type EmailTemplateName = 'WELCOME' | 'RECOVERY' | 'NOTIFICATION';

type EmailTemplatePayload = {
  to: string;
  subject: string;
  template: EmailTemplateName;
  context?: Record<string, unknown>;
  from?: string;
};

type EmailHtmlPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

type EmailPayload = EmailHtmlPayload | EmailTemplatePayload;

type EmailSendResult =
  | { ok: true; provider: 'resend'; id?: string | null }
  | { ok: false; provider: 'resend' | 'disabled'; reason: string };

const RESEND_API_URL = 'https://api.resend.com/emails';

const getResendApiKey = () => String(process.env.RESEND_API_KEY || '').trim();
const getEmailFrom = () => String(process.env.RESEND_FROM_EMAIL || 'Viva360 <noreply@viva360.app>').trim();
const isEmailEnabled = () => !!getResendApiKey();

async function sendViaResend(payload: EmailPayload): Promise<EmailSendResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { ok: false, provider: 'disabled', reason: 'RESEND_API_KEY not configured' };
  }

  try {
    const rendered = normalizePayload(payload);
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: rendered.from || getEmailFrom(),
        to: [rendered.to],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.warn('email.resend_failed', {
        status: response.status,
        to: rendered.to,
        error: typeof json?.message === 'string' ? json.message : 'unknown',
      });
      return { ok: false, provider: 'resend', reason: `HTTP ${response.status}` };
    }

    logger.info('email.sent', { provider: 'resend', to: rendered.to, id: json?.id || null });
    return { ok: true, provider: 'resend', id: json?.id || null };
  } catch (error) {
    logger.warn('email.resend_exception', {
      to: 'to' in payload ? payload.to : undefined,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, provider: 'resend', reason: 'exception' };
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePayload(payload: EmailPayload): EmailHtmlPayload {
  if ('html' in payload) return payload;

  const ctx = payload.context || {};
  switch (payload.template) {
    case 'WELCOME': {
      const name = escapeHtml(ctx.name || 'alma querida');
      return {
        to: payload.to,
        subject: payload.subject,
        from: payload.from,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937"><h2 style="margin:0 0 12px">Bem-vindo ao Viva360</h2><p style="margin:0 0 12px">Olá, <strong>${name}</strong>.</p><p style="margin:0 0 12px">Sua jornada foi iniciada com sucesso.</p></div>`,
        text: `Bem-vindo ao Viva360. Olá, ${String(ctx.name || 'alma querida')}. Sua jornada foi iniciada com sucesso.`,
      };
    }
    case 'RECOVERY': {
      const link = escapeHtml(ctx.link || '');
      const name = escapeHtml(ctx.name || 'alma querida');
      return {
        to: payload.to,
        subject: payload.subject,
        from: payload.from,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937"><h2 style="margin:0 0 12px">Recuperação de acesso</h2><p style="margin:0 0 12px">Olá, ${name}.</p><p style="margin:0 0 12px">Use este link para redefinir sua senha:</p><p style="margin:0 0 12px"><a href="${link}">${link}</a></p></div>`,
        text: `Recuperação de acesso Viva360. Link: ${String(ctx.link || '')}`,
      };
    }
    case 'NOTIFICATION':
    default: {
      const body = escapeHtml(ctx.body || '');
      return {
        to: payload.to,
        subject: payload.subject,
        from: payload.from,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937"><h2 style="margin:0 0 12px">${escapeHtml(payload.subject)}</h2><p style="margin:0">${body}</p></div>`,
        text: `${payload.subject}\n\n${String(ctx.body || '')}`,
      };
    }
  }
}

export const emailService = {
  isEnabled: isEmailEnabled,
  send: sendViaResend,
  async sendTribeInvite(input: { to: string; hubName?: string | null; token?: string | null; inviteId: string }) {
    const subject = `Convite Viva360${input.hubName ? ` • ${input.hubName}` : ''}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="margin:0 0 12px;">Você recebeu um convite no Viva360</h2>
        <p style="margin:0 0 12px;">Um santuário convidou você para se conectar na plataforma.</p>
        <p style="margin:0 0 12px;"><strong>ID do convite:</strong> ${input.inviteId}</p>
        ${input.token ? `<p style="margin:0 0 12px;"><strong>Token:</strong> ${input.token}</p>` : ''}
        <p style="margin:16px 0 0; color:#6b7280; font-size:12px;">Se você não esperava este e-mail, ignore esta mensagem.</p>
      </div>
    `;
    const text = `Você recebeu um convite no Viva360. InviteId=${input.inviteId}${input.token ? ` Token=${input.token}` : ''}`;
    return sendViaResend({ to: input.to, subject, html, text });
  },
};
