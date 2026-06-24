# econmesh-admin

Painel administrativo da plataforma Econmesh — acesso **exclusivo para usuários com role `admin`**.

## Diferenças em relação ao `econmesh-app`

- Sem autocadastro público (apenas login)
- Autenticação via `POST /api/v1/auth/admin/login`
- Gestão cross-tenant de usuários, empresas e oportunidades
- Módulos Blog e Notificações (placeholders)

## Getting Started

```bash
npm install
npm run dev:web
```

Abra [http://localhost:3002](http://localhost:3002).

Configure `.env` a partir de `.env.example` (API URL, Firebase, `SESSION_SECRET`).

## Primeiro administrador

Siga [econmesh-api/docs/ADMIN_BOOTSTRAP.md](../econmesh-api/docs/ADMIN_BOOTSTRAP.md) para criar o primeiro usuário admin manualmente no Firebase + MongoDB.

## Estrutura

```
econmesh-admin/
├── apps/web/          # Next.js admin (porta 3002)
├── packages/ui/       # Componentes compartilhados
├── packages/env/      # Variáveis de ambiente tipadas
└── packages/config/   # TypeScript config
```
