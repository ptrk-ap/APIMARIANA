# API Mariana

API Node.js para autenticação e consulta de dados. A aplicação utiliza PostgreSQL e foi preparada para execução em contêineres Docker.

## Requisitos

- **Docker** e **Docker Compose** (recomendado para produção e homologação)
- Alternativamente para desenvolvimento local sem contêiner: **Node.js** (versão LTS >= 20.x) e **PostgreSQL** acessível

---

## Configuração do ambiente

Crie o arquivo `.env` a partir do modelo `.env.example` e informe os valores do ambiente:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `PORT` | Não | `3001` | Porta HTTP da API. |
| `DATABASE_URL` | Sim | - | String de conexão do PostgreSQL (`postgresql://user:pass@host:5432/db`). |
| `ALLOWED_TOKENS` | Sim | - | Tokens estáticos autorizados a acessar a API, separados por vírgula. |
| `NLP_API_URL` | Sim | - | URL interna do `POST /consultar` do serviço NLPMARIANA. |
| `NODE_ENV` | Não | `production` | Ambiente de execução (`production` ou `development`). |

> **Aviso:** Nunca envie o arquivo `.env` para o repositório Git.

---

## Execução com Docker (Recomendado)

### 1. Usando Docker Compose

Para construir a imagem e subir o serviço em segundo plano:

```bash
docker compose up -d --build
```

Ou usando o script do `package.json`:

```bash
npm run docker:up
```

Para acompanhar os logs em tempo real:

```bash
docker compose logs -f api
# ou
npm run docker:logs
```

Para parar os contêineres:

```bash
docker compose down
# ou
npm run docker:down
```

### 2. Usando Docker CLI diretamente

1. **Build da imagem:**
   ```bash
   docker build -t api-mariana .
   ```

2. **Execução do contêiner:**
   ```bash
   docker run -d \
     --name api-mariana \
     --restart unless-stopped \
     -p 3001:3001 \
     --env-file .env \
     api-mariana
   ```

---

## Execução local (sem Docker)

Instale as dependências:

```bash
npm install
```

Inicie o servidor em modo de produção:

```bash
npm start
```

Ou em modo de desenvolvimento (com reinício automático via `nodemon`):

```bash
npm run dev
```

---

## Endpoints da API

| Método | Rota | Autenticação | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/health` | Não | Healthcheck da API e validação da conexão com o PostgreSQL. |
| `POST` | `/consultar` | Sim (`Bearer <token>`) | Encaminha uma consulta ao serviço NLPMARIANA (`{ "frase": "..." }`). |
| `GET` | `/` | Sim (`Bearer <token>`) | Endpoint de boas-vindas / teste de conexão autenticada. |

> **Nota:** As rotas protegidas validam o token no cabeçalho `Authorization: Bearer <TOKEN>`, comparando-o com os valores configurados em `ALLOWED_TOKENS`.

### Rate Limiting

A API possui limitação de taxa por IP de 100 requisições a cada 15 minutos. A rota `/health` não é limitada para permitir monitoramento contínuo por orquestradores (Docker, Kubernetes) ou proxies reversos.

---

## Operação e Monitoramento

### Verificação de Saúde (Health Check)

O contêiner possui um `HEALTHCHECK` embutido configurado para verificar a rota `/health` periodicamente:

```bash
docker inspect --format='{{json .State.Health.Status}}' api-mariana
```

### Encerramento Gracioso (Graceful Shutdown)

A aplicação trata os sinais `SIGTERM` e `SIGINT` emitidos pelo Docker ao parar o contêiner (`docker stop`). Ao receber o sinal:
1. Deixa de aceitar novas requisições HTTP;
2. Conclui as requisições em andamento;
3. Fecha o pool de conexões com o PostgreSQL;
4. Encerra o processo de forma limpa.

### Proxy Reverso

Em produção, exponha a aplicação atrás de um proxy reverso (Nginx, Traefik, Caddy, etc.) com terminação SSL/TLS (HTTPS). A aplicação está configurada com `trust proxy` para capturar adequadamente o IP real do cliente.
