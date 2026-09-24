// Middleware de autenticação por token estático.
// Os tokens válidos são definidos na variável de ambiente ALLOWED_TOKENS
// no arquivo .env.production, separados por vírgula.
// Exemplo: ALLOWED_TOKENS=token-maquina-a,token-maquina-b

const allowedTokens = new Set(
  (process.env.ALLOWED_TOKENS || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
);

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (
    !scheme ||
    scheme.toLowerCase() !== 'bearer' ||
    !token
  ) {
    return res.status(401).json({
      error: 'Formato inválido. Use: Bearer <token>'
    });
  }

  if (!allowedTokens.has(token)) {
    return res.status(403).json({
      error: 'Token não autorizado'
    });
  }

  next();
};

module.exports = authMiddleware;