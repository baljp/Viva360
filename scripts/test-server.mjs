/**
 * Servidor de teste local para endpoints da API
 * Simula os endpoints Vercel Serverless para testes locais
 */
import http from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

const handlers = {
    '/api/professionals': async () => {
        try {
            const professionals = await prisma.professional.findMany();
            return { status: 200, data: professionals };
        } catch (error) {
            return { status: 500, data: { error: 'Failed to fetch professionals' } };
        }
    },
    '/api/clinics': async () => {
        try {
            const clinics = await prisma.clinic.findMany();
            return { status: 200, data: clinics };
        } catch (error) {
            return { status: 500, data: { error: 'Failed to fetch clinics' } };
        }
    },
    '/api/health': async () => {
        return { status: 200, data: { status: 'ok', timestamp: new Date().toISOString() } };
    }
};

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const handler = handlers[req.url];

    if (handler) {
        const result = await handler();
        res.writeHead(result.status);
        res.end(JSON.stringify(result.data));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor de teste API rodando em http://localhost:${PORT}`);
    console.log('\n📌 Endpoints disponíveis:');
    console.log('   GET /api/professionals');
    console.log('   GET /api/clinics');
    console.log('   GET /api/health');
    console.log('\n💡 Use Ctrl+C para encerrar\n');
});

process.on('SIGINT', async () => {
    console.log('\n👋 Encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});
