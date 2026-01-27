#!/bin/bash
set -e

echo "🔮 Viva360: Verificação de Demo Enterprise"
echo "=========================================="

echo "🔹 1/3: Integridade do Código (Type Check)"
npx tsc --noEmit
echo "✅ Types OK"

echo "🔹 2/3: Arquitetura de Fluxo (Coverage)"
npx vitest run src/tests/coverageFlows.test.ts
echo "✅ Architecture OK"

echo "🔹 3/3: Simulação de Usuário (E2E Robot)"
npx playwright test tests/e2e_demo.spec.ts
echo "✅ User Journey OK"

echo "=========================================="
echo "🚀 SISTEMA PRONTO PARA DEMO"
