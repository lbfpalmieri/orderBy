# Design de Páginas — Automatizador de Pedidos (Desktop-first)

## Padrões Globais
**Layout**: desktop-first com container central (max-width 1120px), padding lateral 24px; grid/flex híbrido.

**Meta (base)**
- title: “Automatizador de Pedidos”
- description: “Cadastro de produtos, criação/importação de pedidos e totais por chocolate.”
- Open Graph: og:title = title, og:description = description, og:type = website

**Tokens / Estilo**
- Background: #0B1220 (app) e #0F172A (cards)
- Texto: #E5E7EB; texto secundário #94A3B8
- Primária: #22C55E (ações principais)
- Alerta/erro: #EF4444; Aviso: #F59E0B
- Tipografia: 14/16/20/28px (body, label, h3, h1)
- Botões: raio 10px; hover com leve aumento de brilho; disabled com opacidade 50%
- Inputs: fundo #111827; borda #243244; foco com outline #22C55E

**Componentes compartilhados**
- Topbar: nome do produto + navegação (Produtos / Loja / Fábrica)
- Card: título + conteúdo + ações
- Tabela de itens (linhas editáveis)
- Bloco “Totais” (cards pequenos em grid 3 colunas)

---

## Página: Produtos (/produtos)
**Meta**: title “Produtos — Automatizador de Pedidos”

**Estrutura**
1) Topbar
2) Seção “Cadastro de Produto” (card)
3) Seção “Produtos Cadastrados” (card com tabela)

**Seções & Componentes**
- Card: Cadastro/Edição
  - Campos (grid 2 colunas no desktop):
    - Nome do produto (input texto)
    - Tipo de chocolate (select)
    - Unidade (select: saco/kg/unidade)
    - Peso por unidade (kg) (input numérico; visível quando unidade ≠ kg)
  - Ações: “Salvar” (primária), “Limpar” (secundária)
  - Estados: erro inline por campo; alerta quando nome duplicado
- Card: Lista
  - Busca por nome (input)
  - Tabela: Nome | Tipo de chocolate | Unidade | Peso/unid | Ações (Editar)

**Responsivo**
- <= 768px: grid vira 1 coluna; tabela com scroll horizontal.

---

## Página: Loja (Criar Pedido) (/loja)
**Meta**: title “Loja — Criar Pedido”

**Estrutura**
1) Topbar
2) Duas colunas (desktop): esquerda “Itens do pedido”, direita “Totais”

**Seções & Componentes**
- Coluna esquerda: Card “Itens do pedido”
  - Linha de adição rápida:
    - Select de produto (buscável)
    - Quantidade (numérico)
    - Botão “Adicionar”
  - Tabela editável:
    - Produto | Unidade | Quantidade (editável) | Remover
  - Validações: quantidade > 0; produto obrigatório
- Coluna direita: Card “Totais”
  - Grid 3 cards:
    - Total de sacos
    - Total de kg
    - Tipos de chocolate (card expandido ou lista)
  - Lista “Kg por tipo de chocolate”:
    - Cada tipo com barra horizontal proporcional + valor em kg

**Interação**
- Atualização de totais em tempo real ao adicionar/editar/remover.

---

## Página: Fábrica (Importar Texto) (/fabrica)
**Meta**: title “Fábrica — Importar Pedido”

**Estrutura**
1) Topbar
2) Duas colunas (desktop): esquerda “Importação”, direita “Totais e itens interpretados”

**Seções & Componentes**
- Coluna esquerda: Card “Colar texto do pedido”
  - Textarea grande (mín. 240px altura)
  - Ajuda de formato (texto pequeno): “Uma linha por item: quantidade; nome_do_produto”
  - Botão “Processar texto”
  - Área de erros:
    - Lista de linhas inválidas
    - Lista de produtos não encontrados
- Coluna direita: Card “Itens interpretados”
  - Tabela: Produto | Quantidade | Unidade | Status (OK/Erro)
- Card “Totais”
  - Mesmo padrão da página Loja: sacos, kg, kg por tipo

**Estados**
- Vazio: instrução + exemplo curto
- Erro parcial: totais calculados apenas para itens válidos (indicando contagem de inválidos)
