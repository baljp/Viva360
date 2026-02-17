import { logger } from '../lib/logger';

interface ValidatedEmail {
  to: string;
  subject: string;
  template: 'WELCOME' | 'RECOVERY' | 'NOTIFICATION';
  context: any;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async send(email: ValidatedEmail): Promise<boolean> {
    logger.info('email.send', {
      to: email.to,
      subject: email.subject,
      template: email.template,
    });
    
    // RENDER TEMPLATE (Simple simulation for now)
    let body = "";
    if (email.template === 'WELCOME') {
      body = `
      🌿 Olá, ${email.context.name}!
      
      Gratidão imensa por se conectar conosco.
      Sua jornada no Viva360 começa agora, um espaço sagrado para sua evolução.
      
      Sua semente foi plantada: ${new Date().toISOString()}
      
      Com amor,
      Equipe Viva360 ✨
      `;
    } else if (email.template === 'RECOVERY') {
      body = `
      🗝️ Recuperação de Acesso
      
      Percebemos que você precisou de uma chave de auxílio.
      Use este link para restaurar sua harmonia digital:
      ${email.context.link}
      
      (Válido por 1 hora)
      `;
    }

    logger.debug('email.rendered', {
      template: email.template,
      // Avoid logging the full body (can contain PII/tokens).
      bodyLength: body.length,
    });
    logger.info('email.sent', { transport: 'MOCK_TRANSPORT' });
    
    // In production, integrate NodeMailer or Resend here
    return true;
  }
}

export const emailService = EmailService.getInstance();
