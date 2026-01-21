
import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do build (pasta dist)
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes Placeholder
// No futuro, suas rotas de API reais entrarão aqui
// app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'online', timestamp: new Date() });
});

// SPA Fallback: Qualquer rota não encontrada vai para o index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✨ Servidor Viva360 rodando na porta ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
