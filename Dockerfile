# ==========================================
# Base Image
# Node 22 Alpine: ultra-leve, seguro e rápido (~50MB)
# ==========================================
FROM node:22-alpine

# Define ambiente de produção padrão
ENV NODE_ENV=production

# Diretório de trabalho da aplicação no contêiner
WORKDIR /usr/src/app

# Copia os manifestos de dependência
COPY package*.json ./

# Instala apenas dependências de produção de forma limpa e determinística
RUN npm ci --omit=dev && npm cache clean --force

# Copia os arquivos de código-fonte necessários
COPY src ./src

# Utiliza usuário não-root nativo do Node para segurança
USER node

# Porta padrão exposta
EXPOSE 3001

# Healthcheck nativo utilizando fetch (Node 18+)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3001) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Inicia a aplicação diretamente com node para receber sinais de encerramento (SIGTERM/SIGINT)
CMD ["node", "src/index.js"]
