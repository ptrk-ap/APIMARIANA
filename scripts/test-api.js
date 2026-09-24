#!/usr/bin/env node
/**
 * Script de Teste - APIMARIANA
 * 
 * Execução:
 *   node scripts/test-api.js
 * 
 * Pré-requisitos:
 *   - API rodando (npm start ou node src/index.js)
 *   - Token correto definido em TOKEN abaixo (ou via variável de ambiente)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TOKEN    = process.env.API_TOKEN || 'f79ec13a3b921ce8d3a72ad1510a0a31a5031777dda9561dc5931dac42559449';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

let passed = 0;
let failed = 0;

function log(label, ok, detail = '') {
  const mark = ok ? '✅' : '❌';
  console.log(`  ${mark}  ${label}${detail ? `  →  ${detail}` : ''}`);
  ok ? passed++ : failed++;
}

async function request(method, path, body) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

// ─────────────────────────────────────────────
// TESTES
// ─────────────────────────────────────────────

async function testeHealth() {
  console.log('\n📋 Health Check');
  const { status, json } = await request('GET', '/health');
  log('GET /health → 200', status === 200, `status: ${json?.status}`);
}

async function testeRaiz() {
  console.log('\n📋 Endpoint Raiz (autenticado)');

  // Sem token
  const r1 = await fetch(`${BASE_URL}/`, { headers: { 'Content-Type': 'application/json' } });
  log('GET / sem token → 401', r1.status === 401);

  // Token inválido
  const r2 = await fetch(`${BASE_URL}/`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token-invalido' },
  });
  log('GET / token inválido → 403', r2.status === 403);

  // Token correto
  const { status, json } = await request('GET', '/');
  log('GET / token correto → 200', status === 200, json?.mensagem);
}

async function testeConsultar() {
  console.log('\n📋 Endpoint /consultar');

  // Sem token
  const r1 = await fetch(`${BASE_URL}/consultar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frase: 'teste' }),
  });
  log('POST /consultar sem token → 401', r1.status === 401);

  // Sem body
  const r2 = await request('POST', '/consultar', {});
  log('POST /consultar sem frase → 400', r2.status === 400, r2.json?.erro);

  // Frase inválida (número)
  const r3 = await request('POST', '/consultar', { frase: 12345 });
  log('POST /consultar frase inválida → 400', r3.status === 400);

  // Requisição válida (pode retornar 200 ou 502 dependendo do NLP estar no ar)
  const r4 = await request('POST', '/consultar', { frase: 'despesas pagas na seplan' });
  const ok4 = [200, 502].includes(r4.status);
  log(
    `POST /consultar frase válida → ${r4.status}`,
    ok4,
    r4.status === 502 ? '(NLP offline — esperado em ambiente de teste)' : JSON.stringify(r4.json)
  );
}

async function testeRotaNaoExistente() {
  console.log('\n📋 Rota inexistente');
  const { status } = await request('GET', '/rota-que-nao-existe');
  log('GET /rota-inexistente → 404', status === 404);
}

// ─────────────────────────────────────────────
// EXECUÇÃO
// ─────────────────────────────────────────────

(async () => {
  console.log('═══════════════════════════════════════');
  console.log('  🧪  APIMARIANA — Script de Testes');
  console.log(`  🌐  ${BASE_URL}`);
  console.log('═══════════════════════════════════════');

  try {
    await testeHealth();
    await testeRaiz();
    await testeConsultar();
    await testeRotaNaoExistente();
  } catch (err) {
    console.error('\n🚨 Erro ao executar testes:', err.message);
    console.error('   → A API está rodando em', BASE_URL, '?');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  Resultado: ${passed} passou(aram) | ${failed} falhou(aram)`);
  console.log('═══════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
})();
