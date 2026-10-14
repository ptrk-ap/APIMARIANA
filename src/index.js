require('dotenv').config();

const express = require('express');
const authMiddleware = require('./authMiddleware');
const { ipRateLimiter } = require('./middlewares/rateLimiter');
const db = require('./config/database');

const requiredEnv = [
  'DATABASE_URL',
  'ALLOWED_TOKENS',
  'NLP_API_URL'
];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error(`Variáveis de ambiente ausentes: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// OBRIGATÓRIO: Captura o IP real do cliente quando operando atrás do Nginx
app.set('trust proxy', 1);

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Falha na verificação de saúde do banco:', error.message);
    return res.status(503).json({ status: 'indisponível' });
  }
});

// Aplica o Rate Limit em todas as rotas da API, exceto na verificação de saúde.
app.use(ipRateLimiter);

async function consultarNlp(req, res) {
  const frase = req.body?.frase ?? req.query.frase;

  if (!frase || typeof frase !== 'string') {
    return res.status(400).json({ erro: "Campo 'frase' é obrigatório" });
  }

  try {
    const respostaNlp = await fetch(process.env.NLP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frase }),
      signal: AbortSignal.timeout(30000)
    });
    const conteudo = await respostaNlp.text();

    try {
      return res.status(respostaNlp.status).json(JSON.parse(conteudo));
    } catch {
      console.error('NLPMARIANA retornou uma resposta que não é JSON.');
      return res.status(502).json({ erro: 'Resposta inválida do serviço de consulta' });
    }
  } catch (error) {
    const mensagem = error.name === 'TimeoutError'
      ? 'Tempo limite ao consultar o serviço de linguagem natural'
      : 'Serviço de linguagem natural indisponível';

    console.error('Falha ao consultar o NLPMARIANA:', error.message);
    return res.status(502).json({ erro: mensagem });
  }
}

app.post('/consultar', authMiddleware, consultarNlp);
//app.get('/consultar', authMiddleware, consultarNlp);

app.get('/', authMiddleware, (_req, res) => {
  return res.json({ mensagem: 'Bem-vindo à API MARIANA.' });
});

const PORT = Number(process.env.PORT) || 3001;
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Sinal ${signal} recebido. Encerrando a API...`);

  // Timeout forçado para garantir encerramento do contêiner caso conexões fiquem pendentes
  const forceExitTimer = setTimeout(() => {
    console.error('Encerramento forçado por tempo limite.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async (error) => {
    try {
      await db.destroy();
      console.log('Conexões com o banco encerradas com sucesso.');
    } catch (dbError) {
      console.error('Falha ao encerrar conexões com o banco:', dbError.message);
    }

    if (error) {
      console.error('Falha ao encerrar o servidor HTTP:', error.message);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  console.error('Exceção não capturada:', error);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('Rejeição não tratada:', reason);
  shutdown('unhandledRejection');
});
