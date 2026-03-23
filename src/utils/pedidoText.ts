import { CATEGORIA_LABEL, type CategoriaProduto, type PedidoItem } from "@/utils/domain";

export const LOJAS = ["Loja 1", "Loja 2", "Loja 3", "Loja 4", "Loja 5", "Loja 6"] as const;
export const CATEGORIA_ORDER: CategoriaProduto[] = ["bombons", "barras", "trufas", "ursos", "licores", "outros"];

export type ItemsByLoja = Record<string, PedidoItem[]>;

function formatQty(item: PedidoItem) {
  const raw = Number.isInteger(item.quantidade) ? String(item.quantidade) : String(item.quantidade).replace(".", ",");
  if (item.unidade === "saco") return `${raw}s`;
  if (item.unidade === "kg") return `${raw}kg`;
  return `${raw} un`;
}

export function buildPedidoText(itemsByLoja: ItemsByLoja, lojaFallback: string) {
  const known = LOJAS.map((l) => [l, itemsByLoja[l] ?? []] as const).filter(([, list]) => list.length > 0);
  const extra = Object.entries(itemsByLoja)
    .filter(([k, list]) => !LOJAS.includes(k as (typeof LOJAS)[number]) && list && list.length > 0)
    .map(([k, list]) => [k, list] as const);
  const lojasComItens = [...known, ...extra];
  if (!lojasComItens.length) return `${lojaFallback} precisa`;
  const lines: string[] = [];
  for (const [lojaNome, list] of lojasComItens) {
    const byCategoria = new Map<CategoriaProduto, PedidoItem[]>();
    for (const it of list) {
      const l = byCategoria.get(it.categoria) ?? [];
      l.push(it);
      byCategoria.set(it.categoria, l);
    }
    lines.push(`${lojaNome} precisa`);
    for (const cat of CATEGORIA_ORDER) {
      const catList = byCategoria.get(cat);
      if (!catList?.length) continue;
      lines.push(CATEGORIA_LABEL[cat]);
      const sorted = [...catList].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      for (const it of sorted) {
        lines.push(`${it.nome} ${formatQty(it)}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

