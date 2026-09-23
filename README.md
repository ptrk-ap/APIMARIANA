# API Mariana

API Node.js para autenticação e consulta de dados. A aplicação usa PostgreSQL e foi preparada para execução em produção com PM2.

## Requisitos

- Node.js (versão LTS recomendada)
- PostgreSQL acessível pela aplicação
- PM2 instalado globalmente no servidor de produção

## Configuração do ambiente

Crie o arquivo `.env.production` a partir do modelo `.env.example` e informe os valores do ambiente:

```bash
cp .env.example .env.production
```

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta HTTP da API. |
| `DATABASE_URL` | String de conexão do PostgreSQL. |
| `JWT_SECRET` | Chave usada para assinar e validar tokens JWT. |
| `ADMIN_USERNAME` | Usuário administrativo inicial. |
| `ADMIN_PASSWORD` | Senha administrativa inicial. |
| `NLP_API_URL` | URL interna do `POST /consultar` do serviço NLPMARIANA. |

Nunca envie `.env.production` ao repositório.

## Execução local

```bash
npm install
npm start
```

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

## Endpoints principais

| Método | Rota | Autenticação | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/health` | Não | Verifica a disponibilidade da API e do banco. |
| `POST` | `/auth` | Não | Autenticação. |
| `POST` | `/consultar` | Sim | Encaminha uma consulta ao NLPMARIANA. |
| `GET` | `/consultar?frase=...` | Sim | Alternativa compatível para encaminhar uma consulta. |
| `GET` | `/` | Sim | Endpoint raiz protegido. |

As rotas protegidas exigem token JWT. `POST /consultar` espera `{ "frase": "..." }` e encaminha a solicitação ao `POST /consultar` do NLPMARIANA, usando `NLP_API_URL`. O limite padrão é de 100 requisições por IP a cada 15 minutos; `/health` não é limitado para permitir monitoramento pelo proxy.

## Produção com PM2

Instale as dependências da aplicação:

```bash
npm ci --omit=dev
```

Inicie a API com o perfil de produção:

```bash
pm2 start ecosystem.config.js --env production
```

O processo registrado chama-se `api-mariana`. A configuração inicia três instâncias em cluster, reinicia processos que falhem e limita cada processo a 500 MB de memória.

Após confirmar que a API iniciou corretamente, registre o estado atual do PM2:

```bash
pm2 save
```

Para reiniciar após alterações de código ou de ambiente:

```bash
pm2 reload ecosystem.config.js --env production --update-env
```

## Logs e operação

Os logs são mantidos pelo PM2 em `~/.pm2/logs` no usuário que executa o serviço. Habilite a rotação uma vez por servidor:

```bash
pm2 install pm2-logrotate
```

Comandos úteis:

```bash
pm2 status
pm2 logs api-mariana
pm2 monit
```

## Proxy reverso

Em produção, exponha a aplicação por Nginx ou Caddy com HTTPS. A configuração atual considera um proxy reverso à frente da aplicação; ajuste `trust proxy` se a topologia tiver mais de um proxy.
