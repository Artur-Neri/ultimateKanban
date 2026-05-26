# Ultimate Kanban

Aplicativo web para gerenciar demandas de trabalho CLT e freelance em um quadro Kanban unificado, com suporte a projetos manuais e integração com Azure DevOps.

## Funcionalidades

- Projetos manuais com criação, edição, drag-and-drop e conclusão de tarefas
- Projetos Azure DevOps com PAT criptografado no banco
- Importação de work items atribuídos ao seu usuário
- Atualização de estado no Azure DevOps ao mover cards entre colunas
- Visão unificada de todas as demandas agrupadas por projeto
- Filtros por origem e busca por texto

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Railway)
- @dnd-kit
- Zod

## Configuração

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Configure as variáveis:

```env
DATABASE_URL="postgresql://..."
APP_ENCRYPTION_KEY="uma-chave-longa-e-segura"
```

3. Aplique o schema no banco:

```bash
npm run db:push
```

4. Inicie o app:

```bash
npm run dev
```

## Azure DevOps

Na configuração do projeto Azure DevOps, informe:

- Organização (ex: `minha-org`)
- Projeto Azure (ex: `Sysemp`)
- E-mail atribuído no Azure DevOps
- PAT com escopos de Work Items

O PAT é validado no servidor, criptografado com `APP_ENCRYPTION_KEY` e nunca retornado para o navegador.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run typecheck` — checagem TypeScript
- `npm run db:push` — sincroniza schema Prisma
- `npm run db:studio` — Prisma Studio

## Estrutura principal

- `src/app` — páginas e rotas API
- `src/components` — UI Kanban, projetos e dashboard
- `src/lib/azure-devops` — cliente REST Azure DevOps
- `src/lib/services` — montagem de board e dashboard
- `prisma/schema.prisma` — modelo de dados
