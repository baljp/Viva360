#!/usr/bin/env node
/**
 * Viva360 - Script de Teste de Stress
 * Simula múltiplas requisições simultâneas para testar a performance da API
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4173';
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT || '10', 10);
const TOTAL_REQUESTS = parseInt(process.env.TOTAL || '100', 10);

const endpoints = [
    '/api/professionals',
    '/api/clinics',
];

class StressTest {
    constructor() {
        this.results = [];
        this.errors = [];
        this.startTime = 0;
    }

    async makeRequest(url) {
        const start = Date.now();
        try {
            const response = await fetch(`${BASE_URL}${url}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const duration = Date.now() - start;

            return {
                url,
                status: response.status,
                success: response.ok,
                duration
            };
        } catch (error) {
            return {
                url,
                status: 0,
                success: false,
                duration: Date.now() - start,
                error: error.message
            };
        }
    }

    async runBatch(batchSize) {
        const requests = [];
        for (let i = 0; i < batchSize; i++) {
            const endpoint = endpoints[i % endpoints.length];
            requests.push(this.makeRequest(endpoint));
        }
        return Promise.all(requests);
    }

    async run() {
        console.log('🚀 Viva360 - Teste de Stress\n');
        console.log(`📍 Base URL: ${BASE_URL}`);
        console.log(`📊 Requisições simultâneas: ${CONCURRENT_REQUESTS}`);
        console.log(`📈 Total de requisições: ${TOTAL_REQUESTS}\n`);
        console.log('='.repeat(60));
        console.log('');

        this.startTime = Date.now();
        let completed = 0;

        while (completed < TOTAL_REQUESTS) {
            const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - completed);
            const batchResults = await this.runBatch(batchSize);

            this.results.push(...batchResults);
            completed += batchSize;

            const successCount = batchResults.filter(r => r.success).length;
            const failCount = batchResults.filter(r => !r.success).length;
            const avgDuration = Math.round(batchResults.reduce((a, b) => a + b.duration, 0) / batchResults.length);

            process.stdout.write(`\r📦 Progresso: ${completed}/${TOTAL_REQUESTS} | ✅ ${successCount} | ❌ ${failCount} | ⏱️ ${avgDuration}ms médio`);
        }

        this.printReport();
    }

    printReport() {
        const totalTime = Date.now() - this.startTime;
        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        const durations = successful.map(r => r.duration);
        const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;
        const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
        const p95Index = Math.floor(durations.length * 0.95);
        const p95 = durations.sort((a, b) => a - b)[p95Index] || 0;

        console.log('\n\n' + '='.repeat(60));
        console.log('\n📊 RELATÓRIO DE TESTE DE STRESS\n');

        console.log('📈 Métricas de Requisições:');
        console.log(`   Total: ${this.results.length}`);
        console.log(`   Sucesso: ${successful.length} (${Math.round(successful.length / this.results.length * 100)}%)`);
        console.log(`   Falhas: ${failed.length} (${Math.round(failed.length / this.results.length * 100)}%)`);
        console.log('');

        console.log('⏱️  Métricas de Tempo:');
        console.log(`   Tempo total: ${totalTime}ms`);
        console.log(`   Média: ${avgDuration}ms`);
        console.log(`   Mínimo: ${minDuration}ms`);
        console.log(`   Máximo: ${maxDuration}ms`);
        console.log(`   P95: ${p95}ms`);
        console.log('');

        console.log('🔥 Throughput:');
        console.log(`   Requisições/segundo: ${Math.round(this.results.length / (totalTime / 1000))}`);
        console.log('');

        if (failed.length > 0) {
            console.log('❌ Erros encontrados:');
            const errorGroups = {};
            failed.forEach(r => {
                const key = r.error || `HTTP ${r.status}`;
                errorGroups[key] = (errorGroups[key] || 0) + 1;
            });
            Object.entries(errorGroups).forEach(([error, count]) => {
                console.log(`   ${error}: ${count} ocorrências`);
            });
            console.log('');
        }

        const successRate = successful.length / this.results.length * 100;
        if (successRate >= 99) {
            console.log('🎉 Excelente! Sistema performando muito bem.');
        } else if (successRate >= 95) {
            console.log('✅ Bom! Sistema estável com pequenas falhas.');
        } else if (successRate >= 80) {
            console.log('⚠️  Atenção! Taxa de sucesso abaixo do ideal.');
        } else {
            console.log('🚨 Crítico! Sistema com problemas sérios de estabilidade.');
        }

        console.log('\n' + '='.repeat(60));
    }
}

const test = new StressTest();
test.run();
