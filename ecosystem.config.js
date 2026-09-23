const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carrega .env.production quando disponível; caso contrário, usa .env.
const envFile = fs.existsSync(path.join(__dirname, '.env.production'))
  ? '.env.production'
  : '.env';

dotenv.config({ path: path.join(__dirname, envFile), quiet: true });

module.exports = {
  apps: [
    {
      name: 'api-mariana',
      cwd: __dirname,
      script: './src/index.js',
      instances: '3',
      exec_mode: 'cluster',
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '500M',
      kill_timeout: 10000,
      merge_logs: true,
      time: true,
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        NLP_API_URL: process.env.NLP_API_URL
      }
    }
  ]
};
