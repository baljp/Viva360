#!/usr/bin/env node
/**
 * Viva360 - Script de Teste de Endpoints
 * Testa todos os endpoints da API para verificar integração frontend-backend
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4173';

const endpoints = [
    { name: 'Professionals', url: '/api/professionals', method: 'GET' },
    { name: 'Clinics', url: '/api/clinics', method: 'GET' },
];

async function testEndpoint(endpoint) {
    const startTime = Date.now();
    try {
        const response = await fetch(`${BASE_URL}${endpoint.url}`, {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' }
        });
        const endTime = Date.now();
        const duration = endTime - startTime;

        const data = await response.json().catch(() => null);

        return {
            name: endpoint.name,
            url: endpoint.url,
            status: response.status,
            ok: response.ok,
            duration: `${duration}ms`,
            dataCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
            success: response.ok
        };
    } catch (error) {
        return {
            name: endpoint.name,
            url: endpoint.url,
            status: 'ERROR',
            ok: false,
            duration: `${Date.now() - startTime}ms`,
            error: error.message,
            success: false
        };
    }
}

async function runTests() {
    console.log('🔍 Viva360 - Teste de Endpoints\n');
    console.log(`📍 Base URL: ${BASE_URL}\n`);
    console.log('='.repeat(60));

    const results = [];

    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);

        const statusIcon = result.success ? '✅' : '❌';
        console.log(`${statusIcon} ${result.name}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Tempo: ${result.duration}`);
        if (result.dataCount !== undefined) {
            console.log(`   Registros: ${result.dataCount}`);
        }
        if (result.error) {
            console.log(`   Erro: ${result.error}`);
        }
        console.log('');
    }

    console.log('='.repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Resumo: ${passed} passou, ${failed} falhou`);

    if (failed > 0) {
        console.log('\n⚠️  Alguns testes falharam!');
        process.exit(1);
    } else {
        console.log('\n🎉 Todos os endpoints estão funcionando!');
    }
}

runTests();
