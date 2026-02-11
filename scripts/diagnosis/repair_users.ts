import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('🚨 Faltam variáveis de ambiente (URL ou SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function repairUsers() {
    console.log('🔍 Iniciando reparo de usuários...');

    // Busca usuários via SDK (apenas os que o Supabase reconhece)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Erro ao listar usuários:', listError.message);
        return;
    }

    console.log(`📊 Encontrados ${users.length} usuários no Supabase.`);

    for (const user of users) {
        console.log(`\n👤 Processando: ${user.email} (${user.id})`);
        
        // Verifica se tem confirmação
        if (!user.email_confirmed_at) {
            console.log('   🔸 Confirmando e-mail...');
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
                email_confirm: true
            });
            if (updateError) console.error('   ❌ Falha ao confirmar:', updateError.message);
            else console.log('   ✅ E-mail confirmado.');
        } else {
            console.log('   ✅ E-mail já está confirmado.');
        }

        // Para os usuários que sabemos que estão com problema, podemos forçar um reset de senha
        // se o usuário nos pedir, ou apenas garantir que o metadata de role esteja lá.
        const role = user.user_metadata?.role || 'CLIENT';
        console.log(`   🔹 Role atual: ${role}`);
    }

    console.log('\n✨ Reparo concluído.');
}

repairUsers().catch(console.error);
