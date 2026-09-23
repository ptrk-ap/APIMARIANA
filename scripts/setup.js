/**
 * Script de Setup e Teste de Login
 *
 * Execução: node scripts/setup.js
 *
 * O que este script faz:
 *  1. Conecta ao banco de dados via DATABASE_URL
 *  2. Verifica se a tabela 'usuarios' existe
 *  3. Cria a tabela caso não exista (com colunas: id, usuario, senha, created_at)
 *  4. Insere um usuário de teste (se ainda não existir)
 *  5. Realiza um teste de login direto via AuthService e valida o token JWT
 */

require('dotenv').config({ path: '.env.production' });

const db = require('../src/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const USUARIO_TESTE = 'admin';
const SENHA_TESTE = 'senha123';

// ─────────────────────────────────────────────
// 1. Verificar e criar a tabela 'usuarios'
// ─────────────────────────────────────────────
async function ensureTable() {
  const exists = await db.schema.hasTable('usuarios');

  if (exists) {
    console.log('✅ Tabela "usuarios" já existe.');
    return;
  }

  console.log('⚙️  Tabela "usuarios" não encontrada. Criando...');

  await db.schema.createTable('usuarios', (table) => {
    table.increments('id').primary();
    table.string('usuario', 100).notNullable().unique();
    table.string('senha', 255).notNullable(); // hash bcrypt
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  console.log('✅ Tabela "usuarios" criada com sucesso.');
}

// ─────────────────────────────────────────────
// 2. Inserir usuário de teste (se não existir)
// ─────────────────────────────────────────────
async function seedTestUser() {
  const existing = await db('usuarios').where({ usuario: USUARIO_TESTE }).first();

  if (existing) {
    console.log(`✅ Usuário de teste "${USUARIO_TESTE}" já existe. Pulando inserção.`);
    return;
  }

  const hash = await bcrypt.hash(SENHA_TESTE, 10);
  await db('usuarios').insert({ usuario: USUARIO_TESTE, senha: hash });

  console.log(`✅ Usuário de teste "${USUARIO_TESTE}" inserido com senha hash bcrypt.`);
}

// ─────────────────────────────────────────────
// 3. Teste de Login (valida credenciais e JWT)
// ─────────────────────────────────────────────
async function testarLogin() {
  console.log('\n🔐 Iniciando teste de login...');
  console.log(`   → Usuário: "${USUARIO_TESTE}" | Senha: "${SENHA_TESTE}"`);

  // Busca o usuário no banco
  const user = await db('usuarios').where({ usuario: USUARIO_TESTE }).first();

  if (!user) {
    throw new Error('❌ Usuário não encontrado no banco de dados!');
  }

  // Valida a senha
  const senhaValida = await bcrypt.compare(SENHA_TESTE, user.senha);
  if (!senhaValida) {
    throw new Error('❌ Senha incorreta!');
  }

  console.log('   ✅ Credenciais validadas com sucesso!');

  // Gera o JWT
  const payload = { clientId: user.id, role: 'bot_client' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

  // Valida o token gerado
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log('   ✅ JWT gerado e verificado com sucesso!');
  console.log('\n📋 Resultado do Teste de Login:');
  console.log('   ─────────────────────────────────────────────');
  console.log(`   Token : ${token}`);
  console.log('   ─────────────────────────────────────────────');
  console.log('   Payload decodificado:', decoded);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando script de setup...\n');

  try {
    await ensureTable();
    await seedTestUser();
    await testarLogin();
    console.log('\n✅ Setup e teste concluídos com sucesso!');
  } catch (err) {
    console.error('\n❌ Erro durante o setup:', err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main();
