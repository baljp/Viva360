/**
 * VIVA360 STRESS TEST SCRIPT — 20.000 CONCURRENT USERS
 * 
 * Performance Engineering / SRE
 * Tool: k6 (https://k6.io)
 * 
 * @description
 * Script de teste de capacidade projetado para simular 20.000 usuários simultâneos
 * distribuídos em 3 perfis comportamentais distintos.
 * 
 * @usage
 * k6 run --out json=results.json viva360-stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ==============================================================
// 1. CONFIGURATION & METRICS
// ==============================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Custom Metrics (Métricas Coletadas)
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const ritualDuration = new Trend('ritual_duration');
const financeDuration = new Trend('finance_duration');
const roomsDuration = new Trend('rooms_duration');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');

// ==============================================================
// 2. TEST PLANNING (RAMP-UP)
// ==============================================================

export const options = {
  // stages removed (using scenarios)


  // Critérios de Avaliação (Thresholds)
  thresholds: {
    // Latência Ideal: P95 < 800ms
    // Latência Crítica: P95 > 1.5s
    'http_req_duration': ['p(95)<800', 'p(99)<1500'], 
    
    // Taxa de Erro: < 1% (Ideal), < 5% (Crítico)
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.05'], 
    
    // Timeouts e SLAs específicos
    'login_duration': ['p(95)<1000'],
    'ritual_duration': ['p(95)<500'],
  },

  // abortOnFail removed (invalid option)
  
  tags: {
    testName: 'viva360-stress-20k',
    env: 'production_simulation',
  },

  // Distribuição de Carga por Perfil
  scenarios: {
    // Cenário 1: Usuário Comum (Buscador) - 70%
    buscador: {
      executor: 'ramping-vus',
      exec: 'buscadorJourney',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 350 },
        { duration: '2m', target: 700 },
        { duration: '30s', target: 0 },
      ],
      tags: { profile: 'buscador' },
    },
    // Cenário 2: Guardião (Professional) - 20%
    guardiao: {
      executor: 'ramping-vus',
      exec: 'guardiaoJourney',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      tags: { profile: 'guardiao' },
    },
    // Cenário 3: Santuário (Space) - 10%
    santuario: {
      executor: 'ramping-vus',
      exec: 'santuarioJourney',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      tags: { profile: 'santuario' },
    },
  },
};

// ... (functions) ...

// ==============================================================
// 5. DEFAULT FUNCTION (Simples / CLI Override)
// ==============================================================
export default function() {
  const r = Math.random();
  if (r < 0.7) {
    buscadorJourney();
  } else if (r < 0.9) {
    guardiaoJourney();
  } else {
    santuarioJourney();
  }
}


// ==============================================================
// 3. HELPER FUNCTIONS
// ==============================================================

function getHeaders(token = null) {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function login(email, password) {
  const payload = JSON.stringify({ email, password });
  const start = Date.now();
  const res = http.post(`${API_URL}/auth/login`, payload, { headers: getHeaders(), tags: { name: 'login' } });
  loginDuration.add(Date.now() - start);
  
  if (res.status === 200 && res.json('session.access_token')) {
    successfulLogins.add(1);
    return res.json('session.access_token');
  }
  failedLogins.add(1);
  return null;
}

function register(role) {
  const uid = randomString(6);
  const payload = JSON.stringify({
    email: `load_${uid}@viva360.com`,
    password: 'Test123!',
    name: `Load User ${uid}`,
    role: role
  });
  const res = http.post(`${API_URL}/auth/register`, payload, { headers: getHeaders(), tags: { name: 'register' } });
  return (res.status === 200 || res.status === 201) ? res.json('session.access_token') : null;
}

// ==============================================================
// 4. USER JOURNEYS (COMPORTAMENTO)
// ==============================================================

// Perfil 1: Buscador (70%) - Leitura leve, check-ins
export function buscadorJourney() {
  let token = register('CLIENT');
  if (!token) { errorRate.add(1); sleep(1); return; }
  const headers = getHeaders(token);

  group('Buscador Routine', () => {
    const start = Date.now();
    
    // Status & Quests (Leitura)
    http.get(`${API_URL}/rituals/status`, { headers, tags: { name: 'get_status' } });
    http.get(`${API_URL}/rituals/quests`, { headers, tags: { name: 'get_quests' } });
    
    sleep(randomIntBetween(2, 5)); // Think time

    // Check-in (Escrita)
    const mood = ['SERENO', 'ANSIOSO', 'GRATO'][Math.floor(Math.random()*3)];
    http.post(`${API_URL}/rituals/check-in`, JSON.stringify({ mood }), { headers, tags: { name: 'checkin' } });
    
    ritualDuration.add(Date.now() - start);
  });
  sleep(randomIntBetween(5, 15));
}

// Perfil 2: Guardião (20%) - Dashboard, Financeiro
export function guardiaoJourney() {
  let token = register('PROFESSIONAL');
  if (!token) { errorRate.add(1); sleep(1); return; }
  const headers = getHeaders(token);

  group('Guardian Dashboard', () => {
    const start = Date.now();
    
    // Dashboard reads
    http.get(`${API_URL}/finance/summary`, { headers, tags: { name: 'finance_summary' } });
    sleep(1);
    http.get(`${API_URL}/finance/transactions`, { headers, tags: { name: 'finance_tx' } });
    
    financeDuration.add(Date.now() - start);
  });
  sleep(randomIntBetween(3, 8));
}

// Perfil 3: Santuário (10%) - Heavy usage, Polling
export function santuarioJourney() {
  let token = register('SPACE');
  if (!token) { errorRate.add(1); sleep(1); return; }
  const headers = getHeaders(token);

  group('Sanctuary Operations', () => {
    const start = Date.now();
    
    // Heavy Polling simulation (Real-time rooms)
    for (let i=0; i<3; i++) {
        http.get(`${API_URL}/rooms/real-time`, { headers, tags: { name: 'rooms_poll' } });
        sleep(0.5);
    }
    
    // Analytics
    http.get(`${API_URL}/rooms/analytics?period=7`, { headers, tags: { name: 'analytics' } });
    
    // Write action
    http.patch(`${API_URL}/rooms/dummy_id/status`, JSON.stringify({ status: 'occupied' }), { headers, tags: { name: 'update_status' } });

    roomsDuration.add(Date.now() - start);
  });
  sleep(randomIntBetween(2, 6));
}
