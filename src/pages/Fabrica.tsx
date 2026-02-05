import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useProductsStore } from "@/stores/productsStore";
import {
  CATEGORIA_LABEL,
  type CategoriaProduto,
  TIPO_CHOCOLATE_LABEL,
  UNIDADE_LABEL,
  type PedidoItem,
  type Product,
} from "@/utils/domain";
import { calcularTotais } from "@/utils/totals";
import { normalizeText, parsePedidoLine } from "@/utils/text";

type ParseResult = {
  items: PedidoItem[];
  invalidLines: string[];
  unknownProducts: string[];
  assumedQtyLines: string[];
  unitMismatchLines: string[];
  storeBreakdownByProductId: Record<string, Record<number, number>>;
};

function formatNumberPt(n: number) {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

function formatQty(it: Pick<PedidoItem, "quantidade" | "unidade">) {
  const raw = formatNumberPt(it.quantidade);
  if (it.unidade === "saco") return `${raw}s`;
  if (it.unidade === "kg") return `${raw}kg`;
  return `${raw} un`;
}

function toSuperscriptNumber(n: number) {
  const map: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    ",": "˙",
    ".": "˙",
    "-": "⁻",
    "/": "⁄",
  };

  return formatNumberPt(n)
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
}

function parseLojaNumero(line: string) {
  const n = normalizeText(line);
  const direct = n.match(/^loja\s*(\d+)\b/);
  if (direct) return Number(direct[1]);
  const inside = n.match(/\bloja\s*(\d+)\b/);
  if (inside) return Number(inside[1]);
  return null;
}

const CATEGORIA_ORDER: CategoriaProduto[] = ["bombons", "barras", "trufas", "ursos", "licores", "outros"];

function buildIndex(products: Product[]) {
  const exact = new Map<string, Product>();
  for (const p of products) exact.set(normalizeText(p.nome), p);
  return exact;
}

function resolveProduct(nameRaw: string, exact: Map<string, Product>, products: Product[]) {
  const key = normalizeText(nameRaw);
  const direct = exact.get(key);
  if (direct) return direct;

  const candidates = products.filter((p) => normalizeText(p.nome).includes(key));
  if (candidates.length === 1) return candidates[0];

  return null;
}

function parseTextToItems(
  text: string,
  products: Product[],
  options: { assumeSacoQty: number | null },
): ParseResult {
  const invalidLines: string[] = [];
  const unknownProducts: string[] = [];
  const assumedQtyLines: string[] = [];
  const unitMismatchLines: string[] = [];
  const storeBreakdownByProductId: Record<string, Record<number, number>> = {};

  const exact = buildIndex(products);
  const grouped = new Map<string, PedidoItem>();

  let currentLoja: number | null = null;

  const lines = text.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    const lojaNum = parseLojaNumero(line);
    if (lojaNum) {
      currentLoja = lojaNum;
      continue;
    }

    const parsed = parsePedidoLine(line);
    if (parsed.kind === "skip") continue;
    if (parsed.kind === "invalid") {
      invalidLines.push(`${line} (${parsed.reason})`);
      continue;
    }

    const product = resolveProduct(parsed.nameRaw, exact, products);
    if (!product) {
      unknownProducts.push(line);
      continue;
    }

    let qty = parsed.qty;
    if (!qty) {
      if (options.assumeSacoQty && product.unidade === "saco") {
        qty = options.assumeSacoQty;
        assumedQtyLines.push(line);
      } else {
        invalidLines.push(`${line} (sem quantidade)`);
        continue;
      }
    }

    if (parsed.unitHint && parsed.unitHint !== product.unidade) {
      unitMismatchLines.push(`${line} (texto: ${parsed.unitHint}, cadastro: ${product.unidade})`);
    }

    const prev = grouped.get(product.id);
    if (prev) {
      grouped.set(product.id, { ...prev, quantidade: prev.quantidade + qty });
    } else {
      grouped.set(product.id, {
        productId: product.id,
        nome: product.nome,
        categoria: product.categoria,
        unidade: product.unidade,
        tipo_chocolate: product.tipo_chocolate,
        peso_por_unidade_kg: product.peso_por_unidade_kg,
        quantidade: qty,
      });
    }

    if (currentLoja) {
      storeBreakdownByProductId[product.id] ??= {};
      storeBreakdownByProductId[product.id][currentLoja] = (storeBreakdownByProductId[product.id][currentLoja] ?? 0) + qty;
    }
  }

  return {
    items: [...grouped.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    invalidLines,
    unknownProducts,
    assumedQtyLines,
    unitMismatchLines,
    storeBreakdownByProductId,
  };
}

export default function Fabrica() {
  const { products, fetch } = useProductsStore();

  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const totais = useMemo(() => calcularTotais(result?.items ?? []), [result?.items]);
  const maxKgChocolate = Math.max(...Object.values(totais.kgPorChocolate), 0);

  function process() {
    const parsed = parseTextToItems(raw, products, { assumeSacoQty: 1 });
    setResult(parsed);
  }

  function exportPdf() {
    if (!result?.items.length) return;
    window.print();
  }

  const pedidoProducao = useMemo(() => {
    const items = result?.items ?? [];
    const breakdown = result?.storeBreakdownByProductId ?? {};

    const byCategoria = new Map<CategoriaProduto, PedidoItem[]>();
    for (const it of items) {
      const list = byCategoria.get(it.categoria) ?? [];
      list.push(it);
      byCategoria.set(it.categoria, list);
    }

    const sections: Array<{ categoria: CategoriaProduto; lines: Array<{ id: string; text: string }> }> = [];
    for (const cat of CATEGORIA_ORDER) {
      const list = byCategoria.get(cat);
      if (!list?.length) continue;

      const sorted = [...list].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      const lines = sorted.map((it) => {
        const perStore = breakdown[it.productId] ?? {};
        const stores = Object.entries(perStore)
          .map(([k, v]) => ({ loja: Number(k), qtd: v }))
          .filter((x) => Number.isFinite(x.loja) && x.qtd > 0)
          .sort((a, b) => a.loja - b.loja);

        const breakdownText = stores.length ? stores.map((s) => `${s.loja}${toSuperscriptNumber(s.qtd)}`).join(" ") : "";
        const text = `${it.nome} ${formatQty(it)}${breakdownText ? ` ${breakdownText}` : ""}.`;
        return { id: it.productId, text };
      });

      sections.push({ categoria: cat, lines });
    }

    return sections;
  }, [result]);

  return (
    <div className="space-y-5">
      <div className="screen-only">
        <h1 className="text-2xl font-semibold text-slate-100">Fábrica</h1>
        <p className="text-sm text-slate-400">Cole o texto do WhatsApp e gere os itens padronizados e totais.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr] screen-only">
        <Card>
          <div className="text-sm font-semibold text-slate-100">Colar texto do pedido</div>
          <div className="mt-1 text-xs text-slate-400">
            Uma linha por item. Exemplos: “Bombom Morango 1s”, “Licor Pistache 1s”, “Urso ao leite 150 unidades”.
          </div>

          <textarea
            className="mt-4 h-64 w-full resize-none rounded-xl border border-white/10 bg-[#111827] p-3 text-sm text-slate-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Cole aqui o texto..."
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" onClick={exportPdf} disabled={!result?.items.length}>
              Exportar PDF
            </Button>
            <Button type="button" variant="primary" onClick={process}>
              Processar texto
            </Button>
          </div>

          {result && (result.invalidLines.length > 0 || result.unknownProducts.length > 0 || result.unitMismatchLines.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <div className="text-xs font-semibold text-red-200">Linhas inválidas</div>
                <div className="mt-2 max-h-32 overflow-auto text-xs text-red-200/80">
                  {result.invalidLines.length ? result.invalidLines.map((l, idx) => <div key={idx}>{l}</div>) : <div>Nenhuma</div>}
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-xs font-semibold text-amber-200">Produtos não encontrados</div>
                <div className="mt-2 max-h-32 overflow-auto text-xs text-amber-200/80">
                  {result.unknownProducts.length ? result.unknownProducts.map((l, idx) => <div key={idx}>{l}</div>) : <div>Nenhum</div>}
                </div>
              </div>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="text-xs font-semibold text-sky-200">Possível divergência de unidade</div>
                <div className="mt-2 max-h-32 overflow-auto text-xs text-sky-200/80">
                  {result.unitMismatchLines.length ? result.unitMismatchLines.map((l, idx) => <div key={idx}>{l}</div>) : <div>Nenhuma</div>}
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="text-sm font-semibold text-slate-100">Totais</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Total de sacos</div>
                <div className="mt-1 text-xl font-semibold text-slate-100">{totais.totalSacos}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Total de kg</div>
                <div className="mt-1 text-xl font-semibold text-slate-100">{totais.totalKg}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Itens</div>
                <div className="mt-1 text-xl font-semibold text-slate-100">{result?.items.length ?? 0}</div>
              </div>
            </div>

            {totais.itensSemPesoUnidade > 0 && (
              <div className="mt-3 text-xs text-amber-200">
                {totais.itensSemPesoUnidade} item(ns) por unidade sem peso informado; não entram no total de kg.
              </div>
            )}
          </Card>

          <Card>
            <div className="text-sm font-semibold text-slate-100">Kg por tipo de chocolate</div>
            <div className="mt-3 space-y-2">
              {Object.entries(totais.kgPorChocolate).map(([key, value]) => {
                const v = value as number;
                const pct = maxKgChocolate > 0 ? (v / maxKgChocolate) * 100 : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-slate-300">{TIPO_CHOCOLATE_LABEL[key as keyof typeof TIPO_CHOCOLATE_LABEL]}</div>
                      <div className="font-medium text-slate-100">{v}kg</div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-emerald-500/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">Itens interpretados</div>
                <div className="text-xs text-slate-400">Agrupados por produto cadastrado.</div>
              </div>
              {result?.assumedQtyLines.length ? <div className="text-xs text-slate-400">Assumidos: {result.assumedQtyLines.length}</div> : null}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-3">Produto</th>
                    <th className="py-2 pr-3">Unidade</th>
                    <th className="py-2 pr-3">Quantidade</th>
                    <th className="py-2">Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {(result?.items ?? []).map((i) => (
                    <tr key={i.productId} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-100">{i.nome}</div>
                        <div className="text-xs text-slate-400">{TIPO_CHOCOLATE_LABEL[i.tipo_chocolate]}</div>
                      </td>
                      <td className="py-2 pr-3 text-slate-300">{UNIDADE_LABEL[i.unidade]}</td>
                      <td className="py-2 pr-3 text-slate-100">{formatNumberPt(i.quantidade)}</td>
                      <td className="py-2 text-slate-300">{CATEGORIA_LABEL[i.categoria]}</td>
                    </tr>
                  ))}
                  {(result?.items.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                        Cole um texto e clique em “Processar texto”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <div className="print-only">
        <div className="print-page">
          <div className="print-header">
            <div className="print-title">Pedido de Produção</div>
            <div className="print-meta">Gerado em {new Date().toLocaleString("pt-BR")}</div>
          </div>

          {pedidoProducao.map((sec) => (
            <div key={sec.categoria} className="print-section">
              <div className="print-section-title">{CATEGORIA_LABEL[sec.categoria]}</div>
              <div className="print-list">
                {sec.lines.map((l) => (
                  <div key={l.id} className="print-row">
                    <div className="print-checkbox" />
                    <div className="print-line">{l.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
