# Como o Automatizador de Pedidos funciona (do começo ao fim)

Este sistema existe para transformar pedidos feitos pela Loja em um texto padronizado (fácil de enviar por WhatsApp) e, depois, ajudar a Fábrica a colar esse texto e enxergar tudo consolidado: itens, quantidades e totais em kg/sacos, por tipo de chocolate.

## Quem usa

- **Loja**: monta o pedido, copia o texto e envia para a Fábrica.
- **Fábrica**: cola o texto recebido, confere o que precisa produzir e vê os totais.
- **Admin**: cadastra e mantém a lista de produtos (nome, categoria, unidade, peso e tipo de chocolate).

## Visão rápida (o fluxo em 5 passos)

1) **Admin cadastra produtos** (uma vez, e depois só mantém) em **Produtos**.  
2) **Loja monta o pedido** em **Loja**, escolhendo itens e quantidades por loja.  
3) A Loja clica em **Copiar pedido** e o sistema gera um **texto padronizado**.  
4) A Fábrica recebe esse texto (ex.: WhatsApp), cola em **Fábrica** e o sistema **interpreta** as linhas.  
5) A Fábrica vê **itens consolidados** e **totais** (kg, sacos, kg por tipo de chocolate).

## As telas e o que cada uma faz

### Loja (/loja)

É onde o pedido é montado.

- Você escolhe a loja (Loja 1…Loja 6, ou um nome extra).
- Você adiciona produtos e quantidades.
- O sistema guarda um rascunho automaticamente no navegador para não perder o trabalho.
- Ao final, você copia o pedido em formato de texto.

Quando você copia, o texto fica mais ou menos assim:

```text
Loja 1 precisa
Bombons
Brigadeiro 10 un
Trufa 2kg

Loja 2 precisa
Barras
Barra ao leite 3s
```

Regras importantes desse texto:

- Sempre começa com “{Loja} precisa”.
- Depois vem o nome da categoria (Bombons, Barras, Trufas, Ursos, Licores, Outros).
- Cada item fica em uma linha: “Nome do produto + quantidade + unidade”.
- Unidades usadas no texto:
  - `kg` (ex.: `2kg`)
  - `s` para saco (ex.: `3s`)
  - `un` para unidade (ex.: `10 un`)

### Fábrica (/fabrica)

É onde a Fábrica cola o texto e transforma em lista de produção.

- Você cola o texto (o mesmo que veio da Loja).
- O sistema lê linha por linha e tenta reconhecer itens e quantidades.
- O sistema soma itens iguais (consolida) e calcula totais:
  - total em kg
  - total em sacos (considera 1 saco = 2kg)
  - kg por tipo de chocolate (ao leite, branco, meio amargo, 70%, diet)
  - alerta de itens em unidade sem “peso por unidade” cadastrado

### Produtos (/produtos) — restrito

É o cadastro do “catálogo” que o sistema usa para:

- sugerir/organizar os produtos na Loja
- reconhecer produtos quando a Fábrica cola o texto
- calcular os totais corretamente

Cada produto tem:

- nome
- categoria (Bombons, Barras, …)
- unidade (Kg, Saco, Unidade)
- tipo de chocolate
- peso por unidade (quando a unidade é “Unidade”)

### Histórico (/historico)

Mostra pedidos já salvos.

- Quando você copia o pedido na Loja, o sistema pode oferecer salvar no histórico.
- O histórico pode ser:
  - **no próprio navegador** (local), se a “nuvem” não estiver configurada
  - **na nuvem** (Supabase), se estiver configurado

### Acesso (/acesso)

Tela para digitar a senha de admin quando você precisa acessar áreas restritas (Produtos e Fábrica).

## O que acontece “por trás” (sem complicar)

### Como a Fábrica entende o texto

O sistema tenta reconhecer itens em formatos comuns, por exemplo:

- `Brigadeiro 10 un`
- `Trufa 2kg`
- `3 Barra ao leite` (quantidade no começo também funciona; a unidade vem do cadastro do produto)

Linhas como “Loja 1”, “Bombons”, “precisa” e cabeçalhos são ignoradas. O que sobra vira candidato a item.

Depois disso, o sistema compara o texto do item com o nome dos produtos cadastrados e tenta encontrar o melhor “encaixe”. Se encontrar, soma a quantidade daquele produto ao total.

### Como os totais são calculados

- Se o item é em **kg**, o kg é a própria quantidade.
- Se o item é em **saco**, o sistema soma “sacos” e também converte para kg (1 saco = 2kg).
- Se o item é em **unidade**, o sistema precisa do “peso por unidade (kg)” para converter para kg.
  - Se esse peso não estiver cadastrado, ele não inventa um valor: registra como “item sem peso”.

## Onde os dados ficam guardados

O sistema guarda coisas diferentes em lugares diferentes:

- **Rascunho do pedido (Loja)**: fica no navegador (local), para não perder o que você estava montando.
- **Senha de admin**: fica no navegador (apenas na sessão atual).
- **Catálogo de produtos**: fica no Supabase (banco de dados).
- **Histórico de pedidos**:
  - local, no navegador, se a nuvem não estiver configurada
  - ou no Supabase, se a nuvem estiver configurada e habilitada

## Acesso de administrador (o que é “restrito”)

- As páginas **Produtos** e **Fábrica** são restritas.
- Para acessar, você digita uma senha em **Acesso**.
- A senha padrão usada hoje é `445`.
- Se você fechar o navegador ou a sessão expirar, pode ser necessário digitar de novo.

## Quando o histórico vira “na nuvem”

O histórico usa Supabase quando estas condições são verdadeiras:

- Supabase configurado (URL e ANON KEY no `.env`)
- uma chave de workspace válida em `VITE_ORDER_HISTORY_WORKSPACE_KEY` (serve para separar ambientes/equipes; mínimo 16 caracteres)

Se qualquer uma delas faltar, o histórico funciona em modo local (apenas no navegador).

## Configuração mínima (para funcionar de verdade)

Para uso completo (produtos + histórico na nuvem), você precisa:

- criar um projeto no Supabase
- executar as migrações SQL que criam tabelas e funções
- configurar `.env` com:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ORDER_HISTORY_WORKSPACE_KEY` (se quiser histórico na nuvem)

Sem Supabase, o app até abre, mas não consegue carregar o catálogo de produtos nem salvar histórico na nuvem.

## Para quem mantém o sistema (referências no código)

- Rotas e páginas: [App.tsx](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/App.tsx)
- Loja (montagem e cópia): [Loja.tsx](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/pages/Loja.tsx)
- Formato do texto do pedido: [pedidoText.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/utils/pedidoText.ts)
- Fábrica (consolidação): [Fabrica.tsx](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/pages/Fabrica.tsx)
- Leitura de linhas do texto: [text.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/utils/text.ts)
- Totais: [totals.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/utils/totals.ts)
- Produtos (API e store): [productsApi.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/utils/productsApi.ts), [productsStore.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/stores/productsStore.ts)
- Histórico (local e nuvem): [pedidoHistorico.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/utils/pedidoHistorico.ts), [orderHistoryCloud.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/utils/orderHistoryCloud.ts)
- Supabase (client): [supabaseClient.ts](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/src/utils/supabaseClient.ts)
- Migrações do Supabase: [supabase/migrations](file:///c:/Users/lucas/OneDrive/Documentos/TRAE%20-%20Projects/oderBy/orderBy/supabase/migrations)
