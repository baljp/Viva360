import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-nano-950 text-white">
      <header className="sticky top-0 z-10 bg-nano-900/95 backdrop-blur border-b border-nano-800 px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-nano-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Política de Privacidade</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <p className="text-nano-400 text-sm">Última atualização: Janeiro 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">1. Introdução</h2>
          <p className="text-nano-300 leading-relaxed">
            A Viva360 ("nós", "nosso" ou "nossa") está comprometida em proteger sua privacidade. 
            Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos 
            suas informações quando você utiliza nossa plataforma de bem-estar holístico.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">2. Informações que Coletamos</h2>
          <p className="text-nano-300 leading-relaxed">Podemos coletar os seguintes tipos de informações:</p>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li><strong>Dados de Cadastro:</strong> Nome, e-mail, telefone, foto de perfil</li>
            <li><strong>Dados de Uso:</strong> Interações com a plataforma, agendamentos, preferências</li>
            <li><strong>Dados de Pagamento:</strong> Processados por parceiros seguros (não armazenamos dados de cartão)</li>
            <li><strong>Dados Técnicos:</strong> IP, tipo de dispositivo, navegador (para melhorar a experiência)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">3. Como Usamos Suas Informações</h2>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li>Fornecer e manter nossos serviços</li>
            <li>Processar agendamentos e transações</li>
            <li>Enviar comunicações relevantes sobre sua conta</li>
            <li>Melhorar nossos produtos e serviços</li>
            <li>Cumprir obrigações legais</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">4. Compartilhamento de Dados</h2>
          <p className="text-nano-300 leading-relaxed">
            Não vendemos seus dados pessoais. Podemos compartilhar informações com:
          </p>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li>Profissionais com quem você agenda serviços</li>
            <li>Processadores de pagamento (Stripe)</li>
            <li>Provedores de infraestrutura (hospedagem segura)</li>
            <li>Autoridades, quando exigido por lei</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">5. Seus Direitos (LGPD)</h2>
          <p className="text-nano-300 leading-relaxed">
            Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
          </p>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Revogar seu consentimento a qualquer momento</li>
            <li>Solicitar portabilidade dos dados</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">6. Segurança</h2>
          <p className="text-nano-300 leading-relaxed">
            Implementamos medidas técnicas e organizacionais para proteger seus dados, 
            incluindo criptografia, controle de acesso e monitoramento contínuo.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">7. Contato</h2>
          <p className="text-nano-300 leading-relaxed">
            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
          </p>
          <p className="text-banana-400 font-medium">privacidade@viva360.com.br</p>
        </section>

        <div className="pt-8 border-t border-nano-800">
          <p className="text-nano-500 text-sm text-center">
            © {new Date().getFullYear()} Viva360. Todos os direitos reservados.
          </p>
        </div>
      </main>
    </div>
  );
};

export const TermsOfUse: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-nano-950 text-white">
      <header className="sticky top-0 z-10 bg-nano-900/95 backdrop-blur border-b border-nano-800 px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-nano-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Termos de Uso</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <p className="text-nano-400 text-sm">Última atualização: Janeiro 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">1. Aceitação dos Termos</h2>
          <p className="text-nano-300 leading-relaxed">
            Ao acessar ou usar a plataforma Viva360, você concorda em cumprir estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não utilize nossos serviços.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">2. Descrição do Serviço</h2>
          <p className="text-nano-300 leading-relaxed">
            A Viva360 é uma plataforma que conecta clientes a profissionais de bem-estar holístico, 
            facilitando agendamentos, comunicação e pagamentos. A Viva360 atua como intermediária 
            e não presta diretamente os serviços terapêuticos ou de bem-estar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">3. Cadastro e Conta</h2>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li>Você deve fornecer informações verdadeiras e atualizadas</li>
            <li>Você é responsável por manter a confidencialidade de sua senha</li>
            <li>Você deve ter pelo menos 18 anos para usar a plataforma</li>
            <li>Uma conta por pessoa; contas compartilhadas não são permitidas</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">4. Uso Aceitável</h2>
          <p className="text-nano-300 leading-relaxed">Você concorda em NÃO:</p>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li>Violar leis ou regulamentos aplicáveis</li>
            <li>Assediar, ameaçar ou prejudicar outros usuários</li>
            <li>Publicar conteúdo falso, difamatório ou ilegal</li>
            <li>Tentar acessar áreas restritas da plataforma</li>
            <li>Usar automação não autorizada (bots, scrapers)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">5. Pagamentos e Reembolsos</h2>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li>Os pagamentos são processados por provedores terceiros (Stripe)</li>
            <li>As políticas de cancelamento são definidas por cada profissional</li>
            <li>Disputas devem ser resolvidas primeiro com o profissional</li>
            <li>A Viva360 pode mediar conflitos quando necessário</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">6. Propriedade Intelectual</h2>
          <p className="text-nano-300 leading-relaxed">
            Todo o conteúdo da plataforma (design, código, textos, marca) é propriedade 
            da Viva360 ou de seus licenciadores. Você recebe uma licença limitada e 
            não-exclusiva para uso pessoal da plataforma.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">7. Limitação de Responsabilidade</h2>
          <p className="text-nano-300 leading-relaxed">
            A Viva360 não é responsável por:
          </p>
          <ul className="list-disc list-inside text-nano-300 space-y-2 ml-4">
            <li>Qualidade dos serviços prestados pelos profissionais</li>
            <li>Danos decorrentes do uso ou incapacidade de usar a plataforma</li>
            <li>Ações ou omissões de terceiros</li>
            <li>Interrupções temporárias do serviço</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">8. Modificações</h2>
          <p className="text-nano-300 leading-relaxed">
            Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças 
            significativas por e-mail ou na plataforma. O uso continuado após as alterações 
            constitui aceitação dos novos termos.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">9. Legislação Aplicável</h2>
          <p className="text-nano-300 leading-relaxed">
            Estes termos são regidos pelas leis da República Federativa do Brasil. 
            Qualquer disputa será resolvida no foro da comarca de São Paulo/SP.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-banana-400">10. Contato</h2>
          <p className="text-nano-300 leading-relaxed">
            Para dúvidas sobre estes termos:
          </p>
          <p className="text-banana-400 font-medium">suporte@viva360.com.br</p>
        </section>

        <div className="pt-8 border-t border-nano-800">
          <p className="text-nano-500 text-sm text-center">
            © {new Date().getFullYear()} Viva360. Todos os direitos reservados.
          </p>
        </div>
      </main>
    </div>
  );
};
