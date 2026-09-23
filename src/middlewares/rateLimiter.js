const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const ipRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 100,                  // 100 requisições por IP por janela
  standardHeaders: true,     // Retorna cabeçalhos RateLimit-* (RFC)
  legacyHeaders: false,      // Desabilita cabeçalhos X-RateLimit-* legados
  message: {
    status: 429,
    error: 'Muitas requisições originadas deste IP. Por favor, tente novamente em 15 minutos.'
  },
  // Usa o helper oficial para tratar corretamente IPs IPv4 e IPv6
  // Helper oficial do express-rate-limit para tratar corretamente IPs IPv4 e IPv6
  keyGenerator: ipKeyGenerator,
});

module.exports = { ipRateLimiter };
