
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
    console.log(`\n📧 [EMAIL SERVICE] Sending to ${email.to}`);
    console.log(`   Subject: ${email.subject}`);
    
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

    console.log(`   Body Preview:\n${body}\n`);
    console.log(`   ✅ Sent via [MOCK_TRANSPORT]`);
    
    // In production, integrate NodeMailer or Resend here
    return true;
  }
}

export const emailService = EmailService.getInstance();
