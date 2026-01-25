# Stress Test & Capacity Analysis — 20.000 Usuários

> **Documento de Modelagem de Testes de Carga**
> **Autor:** Performance Engineering Team
> **Data:** 25/01/2026
> **Alvo:** Viva360 Platform

---

## 1. Executive Summary

Este documento modela um teste de stress para validar a capacidade da plataforma Viva360 com **20.000 usuários simultâneos**. O objetivo é identificar o ponto de ruptura (breakpoint), medir a degradação de latência e garantir a estabilidade do sistema sob carga máxima, simulando o comportamento real de produção.

### Contexto do Sistema

| Componente   | Tecnologia        | Observação               |
| ------------ | ----------------- | ------------------------ |
| **Frontend** | React SPA         | CDN hosted (baixo risco) |
| **Backend**  | Node.js API       | Cluster mode (8 workers) |
| **Database** | SQLite/PostgreSQL | Ponto crítico de gargalo |
| **Auth**     | JWT               | Stateless                |

---

## 2. Plano de Teste (Carga Alvo: 20k VUs)

### Distribuição de Usuários

O teste simula fielmente a demografia esperada em produção:

| Perfil                | %   | Qtd (Max) | Comportamento                                |
| --------------------- | --- | --------- | -------------------------------------------- |
| **Buscador (Comum)**  | 70% | 14,000    | Leitura intensiva, check-ins esporádicos     |
| **Guardião (Pro)**    | 20% | 4,000     | Dashboard, financeiro, leitura moderada      |
| **Santuário (Space)** | 10% | 2,000     | Polling real-time, analytics, escrita pesada |

### Ramp-Up Progressivo

A carga será injetada em estágios para identificar exatamente quando o sistema degrada:

```
00:00 - 02:00  ▶   1,000 VUs  (Warm-up)
02:00 - 05:00  ▶   5,000 VUs  (Baseline)
05:00 - 10:00  ▶  10,000 VUs  (Stress Inicial)
10:00 - 15:00  ▶  15,000 VUs  (Escalabilidade)
15:00 - 25:00  ▶  20,000 VUs  (Peak Load / Soak)
25:00 - 30:00  ▶      0 VUs  (Ramp-down)
```

**Critérios de Parada (Abort):**

- Taxa de Erro > 5% por 1 minuto
- Latência P95 > 2.0s por 1 minuto

---

## 3. Métricas Coletadas

O script k6 foi instrumentado para coletar:

- **Throughput:** RPS (Requests per Second) total e por endpoint.
- **Latência:** `P50` (média), `P95` (cauda longa), `P99` (pior caso).
- **Confiabilidade:** Taxa de erros HTTP (4xx/5xx) e Timeouts.
- **Negócio:** Tentativas vs. Sucessos de Login, Check-ins completados.

---

## 4. Critérios de Avaliação (SLOs)

| Indicador        | Ideal (🟢) | Aceitável (🟡) | Crítico (🔴) |
| ---------------- | ---------- | -------------- | ------------ |
| **Latência P95** | < 800ms    | < 1.5s         | > 1.5s       |
| **Taxa de Erro** | < 0.1%     | < 1%           | > 5%         |
| **Throughput**   | 12k+ RPS   | 8k-12k RPS     | < 8k RPS     |

---

## 5. Resultados Estimados (Análise Pré-Teste)

Baseado na arquitetura atual (Node.js Single Instance DB ou SQLite):

- **1k - 5k Usuários:** Sistema deve responder bem (P95 < 500ms). Node.js lida bem com I/O assíncrono.
- **5k - 8k Usuários:** Início de degradação. Latência sobe para ~800ms-1s.
- **8k+ Usuários (Ponto de Ruptura):**
  - Saturação do Event Loop (CPU 100%).
  - Lock contention no banco de dados (especialmente se SQLite).
  - Taxa de erro começa a subir exponencialmente.
- **20.000 Usuários:** **Inviável** na arquitetura atual sem otimizações. Espera-se timeout massivo.

**Gargalos Prováveis:**

1. **Banco de Dados:** Write heavy operations (Check-ins/Logs).
2. **CPU Backend:** Serialização JSON e criptografia (bcrypt/JWT) para 20k concorrência.

---

## 6. Veredito Técnico

> **Capacidade Atual Estimada:** ~6,000 - 8,000 Usuários Simultâneos.

**20.000 é viável hoje?**
❌ **NÃO.** O sistema não suportará 20k usuários simultâneos sem mudanças estruturais.

**Plano de Ação para Suportar 20k:**

1. **Infraestrutura:** Migrar para banco de dados robusto (PostgreSQL) com pooling (PgBouncer).
2. **Caching:** Implementar Redis para rotas de leitura frequente (`status`, `quests`, `summary`).
3. **Horizontal Scaling:** Deploy de múltiplas instâncias da API (Kubernetes/ECS) atrás de Load Balancer.
4. **Otimização:** Remover processamento pesado do caminho crítico (mover para Workers/Queues).

---

## Anexo: Script de Teste

O script executável completo para este plano encontra-se em:
`stress/viva360-stress-test.js`

Para executar:

```bash
k6 run stress/viva360-stress-test.js
```
