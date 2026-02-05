# Automatizador de Pedidos

Aplicação web para cadastrar produtos e padronizar/consolidar pedidos entre loja e fábrica.

## Requisitos
- Node.js + pnpm
- Projeto criado no Supabase

## Configurar Supabase

### 1) Criar tabelas
No Supabase, abra **SQL Editor** e execute o conteúdo do arquivo [001_init.sql](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/Nova%20pasta/orderBy/supabase/migrations/001_init.sql).

### 2) Variáveis de ambiente
Crie um arquivo `.env` na raiz (já existe um `.env` com a URL preenchida) e preencha:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (use a chave **anon/public/publishable**, nunca a **secret**)

## Rodar o projeto

```bash
pnpm install
pnpm run dev
```

## Rotas
- `/produtos`: cadastro/edição de produtos
- `/loja`: criar pedido com totais em tempo real
- `/fabrica`: colar texto e interpretar itens + totais
