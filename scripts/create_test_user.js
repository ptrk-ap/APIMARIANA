const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const knex = require('knex');

const envFile = fs.existsSync(path.join(__dirname, '..', '.env'))
  ? '.env'
  : '.env.production';

dotenv.config({ path: path.join(__dirname, '..', envFile), quiet: true });

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

async function run() {
  try {
    const usuario = 'testuser';
    const senha = 'testpassword';
    
    const existingUser = await db('usuarios').where({ usuario }).first();
    if (existingUser) {
      console.log('User already exists, testuser / testpassword');
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    await db('usuarios').insert({
      usuario: usuario,
      senha: hashedPassword
    });

    console.log('User created successfully: testuser / testpassword');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

run();
