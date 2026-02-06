import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useProductsStore } from "@/stores/productsStore";
import {
  CATEGORIA_LABEL,
  type CategoriaProduto,
  TIPO_CHOCOLATE_LABEL,
  UNIDADE_LABEL,
  type PedidoItem,
} from "@/utils/domain";
import { normalizeText } from "@/utils/text";

function parseQtd(value: string, unidade?: PedidoItem["unidade"]) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fraction = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/);
  if (fraction) {
    const a = Number(fraction[1].replace(",", "."));
    const b = Number(fraction[2].replace(",", "."));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
    const num = a / b;
    if (!Number.isFinite(num) || num <= 0) return null;
    if (unidade === "unidade" && !Number.isInteger(num)) return null;
    return num;
  }

  const num = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) return null;
  if (unidade === "unidade" && !Number.isInteger(num)) return null;
  return num;
}

function scoreFuzzy(haystack: string, query: string) {
  const h = normalizeText(haystack);
  const q = normalizeText(query);
  if (!q) return 0;
  if (h.startsWith(q)) return 1000 - h.length;
  const idx = h.indexOf(q);
  if (idx >= 0) return 800 - idx;

  let qi = 0;
  let last = -1;
  let gap = 0;
  for (let hi = 0; hi < h.length && qi < q.length; hi++) {
    if (h[hi] === q[qi]) {
      if (last >= 0) gap += hi - last - 1;
      last = hi;
      qi++;
    }
  }
  if (qi !== q.length) return null;
  return 200 - gap;
}

function formatQty(item: PedidoItem) {
  const raw = Number.isInteger(item.quantidade) ? String(item.quantidade) : String(item.quantidade).replace(".", ",");
  if (item.unidade === "saco") return `${raw}s`;
  if (item.unidade === "kg") return `${raw}kg`;
  return `${raw} un`;
}

const LOJAS = ["Loja 1", "Loja 2", "Loja 3", "Loja 4", "Loja 5", "Loja 6"] as const;
const CATEGORIA_ORDER: CategoriaProduto[] = ["bombons", "barras", "trufas", "ursos", "licores", "outros"];
const LOJA_DRAFT_KEY = "loja_draft_v1";
const LOJAS_DRAFT_KEY = "lojas_draft_v2";

export default function Loja() {
  const { products, fetch } = useProductsStore();
  const [loja, setLoja] = useState<(typeof LOJAS)[number]>(() => {
    const saved = localStorage.getItem("loja_nome");
    const found = LOJAS.find((l) => l === saved);
    return found ?? "Loja 5";
  });
  const [produtoQuery, setProdutoQuery] = useState("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [qtd, setQtd] = useState("1");
  type ItemsByLoja = Record<string, PedidoItem[]>;
  const [itemsByLoja, setItemsByLoja] = useState<ItemsByLoja>({});
  const currentItems: PedidoItem[] = itemsByLoja[loja] ?? [];
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [comboActive, setComboActive] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedMulti = localStorage.getItem(LOJAS_DRAFT_KEY);
    if (savedMulti) {
      try {
        const parsed = JSON.parse(savedMulti) as unknown;
        if (parsed && typeof parsed === "object") {
          const lojaSaved = (parsed as { loja?: unknown }).loja;
          const itemsSaved = (parsed as { itemsByLoja?: unknown }).itemsByLoja;
          if (typeof lojaSaved === "string") {
            const lojaOk = LOJAS.find((l) => l === lojaSaved) ?? null;
            if (lojaOk) setLoja(lojaOk);
          }
          if (itemsSaved && typeof itemsSaved === "object") {
            setItemsByLoja(itemsSaved as ItemsByLoja);
          }
        }
      } catch {
        // ignore
      }
      return;
    }
    // migração do formato antigo v1
    const saved = localStorage.getItem(LOJA_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as unknown;
        if (!parsed || typeof parsed !== "object") return;
        const lojaSaved = (parsed as { loja?: unknown }).loja;
        const itemsSaved = (parsed as { items?: unknown }).items;
        const lojaOk = typeof lojaSaved === "string" ? (LOJAS.find((l) => l === lojaSaved) ?? null) : null;
        const itemsOk =
          Array.isArray(itemsSaved) &&
          itemsSaved.every(
            (it) =>
              it &&
              typeof it === "object" &&
              typeof (it as { productId?: unknown }).productId === "string" &&
              typeof (it as { nome?: unknown }).nome === "string" &&
              typeof (it as { categoria?: unknown }).categoria === "string" &&
              typeof (it as { unidade?: unknown }).unidade === "string" &&
              typeof (it as { tipo_chocolate?: unknown }).tipo_chocolate === "string" &&
              (typeof (it as { peso_por_unidade_kg?: unknown }).peso_por_unidade_kg === "number" ||
                (it as { peso_por_unidade_kg?: unknown }).peso_por_unidade_kg === null) &&
              typeof (it as { quantidade?: unknown }).quantidade === "number" &&
              Number.isFinite((it as { quantidade: number }).quantidade),
          )
            ? (itemsSaved as PedidoItem[])
            : null;
        if (lojaOk) setLoja(lojaOk);
        if (itemsOk && lojaOk) setItemsByLoja({ [lojaOk]: itemsOk });
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  useEffect(() => {
    setQtyDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const it of currentItems) {
        const key = `${loja}:${it.productId}`;
        const v = prev[key];
        if (v !== undefined) next[key] = v;
      }
      const prevKeys = Object.keys(prev).filter((k) => k.startsWith(`${loja}:`));
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length && nextKeys.every((k) => prev[k] === next[k])) {
        return prev;
      }
      const preserved: Record<string, string> = {};
      for (const k of Object.keys(prev)) {
        if (!k.startsWith(`${loja}:`)) preserved[k] = prev[k];
      }
      return { ...preserved, ...next };
    });
  }, [currentItems, loja]);

  useEffect(() => {
    localStorage.setItem("loja_nome", loja);
  }, [loja]);

  useEffect(() => {
    try {
      localStorage.setItem(LOJAS_DRAFT_KEY, JSON.stringify({ loja, itemsByLoja }));
    } catch {
      return;
    }
  }, [itemsByLoja, loja]);

  const produtoSelecionado = useMemo(() => products.find((p) => p.id === produtoId) ?? null, [products, produtoId]);

  const produtosSugeridos = useMemo(() => {
    const q = produtoQuery.trim();
    if (!products.length) return [];

    const ranked = products
      .map((p) => {
        const hay = `${p.nome} ${CATEGORIA_LABEL[p.categoria]} ${UNIDADE_LABEL[p.unidade]} ${TIPO_CHOCOLATE_LABEL[p.tipo_chocolate]}`;
        const score = scoreFuzzy(hay, q);
        return { p, score };
      })
      .filter((r) => (q ? r.score !== null && r.score > 0 : true))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.p.nome.localeCompare(b.p.nome, "pt-BR"));

    return ranked.slice(0, 18).map((r) => r.p);
  }, [products, produtoQuery]);

  const pedidoText = useMemo(() => {
    const lojasComItens = Object.entries(itemsByLoja).filter(([, list]) => list && list.length > 0);
    if (!lojasComItens.length) return `${loja} precisa`;
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
  }, [itemsByLoja, loja]);

  function setItemsForCurrent(updater: (prev: PedidoItem[]) => PedidoItem[]) {
    setItemsByLoja((prev) => {
      const current = prev[loja] ?? [];
      return { ...prev, [loja]: updater(current) };
    });
  }

  function addItem() {
    setError(null);
    const qtdNum = parseQtd(qtd, produtoSelecionado?.unidade);
    if (!produtoSelecionado) return setError("Selecione um produto.");
    if (!qtdNum) return setError("Informe uma quantidade válida.");

    setItemsForCurrent((prev) => {
      const existing = prev.find((i) => i.productId === produtoSelecionado.id);
      if (existing) {
        return prev.map((i) => (i.productId === existing.productId ? { ...i, quantidade: i.quantidade + qtdNum } : i));
      }
      return [
        ...prev,
        {
          productId: produtoSelecionado.id,
          nome: produtoSelecionado.nome,
          categoria: produtoSelecionado.categoria,
          unidade: produtoSelecionado.unidade,
          tipo_chocolate: produtoSelecionado.tipo_chocolate,
          peso_por_unidade_kg: produtoSelecionado.peso_por_unidade_kg,
          quantidade: qtdNum,
        },
      ];
    });

    setProdutoId("");
    setProdutoQuery("");
    setComboActive(0);
    setComboOpen(false);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function inc(productId: string, delta: number) {
    setQtyDrafts((prev) => {
      const key = `${loja}:${productId}`;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setItemsForCurrent((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i))
        .filter((i) => i.quantidade > 0),
    );
  }

  function setItemQtd(productId: string, value: string) {
    const unidade = currentItems.find((i) => i.productId === productId)?.unidade;
    const n = parseQtd(value, unidade);
    if (n === null) return;
    setItemsForCurrent((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantidade: n } : i)));
  }

  function removeItem(productId: string) {
    setQtyDrafts((prev) => {
      const key = `${loja}:${productId}`;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setItemsForCurrent((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function copyPedido() {
    try {
      await navigator.clipboard.writeText(pedidoText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  function selectProduto(id: string) {
    const p = products.find((pp) => pp.id === id);
    if (!p) return;
    setProdutoId(p.id);
    setProdutoQuery(p.nome);
    setComboOpen(false);
    setComboActive(0);
  }

  function exportPdf() {
    if (!Object.values(itemsByLoja).some((l) => l.length > 0)) return;
    window.print();
  }

  const pedidoPorLoja = useMemo(() => {
    const lojasComItens = Object.entries(itemsByLoja).filter(([, list]) => list && list.length > 0);
    return lojasComItens.map(([lojaNome, list]) => {
      const byCategoria = new Map<CategoriaProduto, PedidoItem[]>();
      for (const it of list) {
        const arr = byCategoria.get(it.categoria) ?? [];
        arr.push(it);
        byCategoria.set(it.categoria, arr);
      }
      const sections: Array<{ categoria: CategoriaProduto; lines: Array<{ id: string; text: string }> }> = [];
      for (const cat of CATEGORIA_ORDER) {
        const arr = byCategoria.get(cat);
        if (!arr?.length) continue;
        const sorted = [...arr].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        const lines = sorted.map((it) => ({ id: it.productId, text: `${it.nome} ${formatQty(it)}` }));
        sections.push({ categoria: cat, lines });
      }
      return { lojaNome, sections };
    });
  }, [itemsByLoja]);

  return (
    <div className="space-y-5">
      <div className="screen-only">
        <h1 className="text-2xl font-semibold text-slate-100">Loja</h1>
        <p className="text-sm text-slate-400">Monte o pedido e copie o texto para enviar no WhatsApp.</p>
      </div>

      <Card className="screen-only">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">Itens do pedido</div>
            <div className="text-xs text-slate-400">Digite para achar o produto rápido, some e adicione.</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setItemsByLoja((prev) => ({ ...prev, [loja]: [] }));
                setQtyDrafts((prev) => {
                  const next: Record<string, string> = {};
                  for (const key of Object.keys(prev)) {
                    if (!key.startsWith(`${loja}:`)) next[key] = prev[key];
                  }
                  return next;
                });
              }}
              disabled={!currentItems.length}
            >
              Limpar
            </Button>
            <Button type="button" variant="primary" onClick={copyPedido} disabled={!Object.values(itemsByLoja).some((l) => l.length > 0)}>
              {copied ? "Copiado" : "Copiar pedido"}
            </Button>
            <Button type="button" onClick={exportPdf} disabled={!Object.values(itemsByLoja).some((l) => l.length > 0)}>
              Exportar PDF (pedido por loja)
            </Button>
          </div>
        </div>

        <form
          className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_140px_140px]"
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
        >
          <div>
            <label className="text-xs text-slate-300">Loja</label>
            <select
              className="h-10 w-full rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-slate-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
              value={loja}
              onChange={(e) => setLoja(e.target.value as (typeof LOJAS)[number])}
            >
              {LOJAS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="text-xs text-slate-300">Produto</label>
            <Input
              ref={searchRef}
              value={produtoQuery}
              onChange={(e) => {
                setProdutoQuery(e.target.value);
                setProdutoId("");
                setComboActive(0);
                setComboOpen(true);
              }}
              onFocus={() => setComboOpen(true)}
              onBlur={() => setTimeout(() => setComboOpen(false), 120)}
              onKeyDown={(e) => {
                if (!comboOpen) return;
                if (e.key === "Escape") {
                  setComboOpen(false);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setComboActive((i) => Math.min(i + 1, Math.max(produtosSugeridos.length - 1, 0)));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setComboActive((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  const id = produtosSugeridos[comboActive]?.id;
                  if (id) {
                    e.preventDefault();
                    selectProduto(id);
                  }
                }
              }}
              placeholder="Digite nome ou categoria..."
            />

            {comboOpen && produtosSugeridos.length > 0 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-white/10 bg-[#0F172A] shadow-lg">
                <div className="max-h-72 overflow-auto py-1">
                  {produtosSugeridos.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      className={
                        "flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition " +
                        (idx === comboActive ? "bg-white/10" : "hover:bg-white/5")
                      }
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => selectProduto(p.id)}
                    >
                      <div>
                        <div className="font-medium text-slate-100">{p.nome}</div>
                        <div className="text-xs text-slate-400">
                          {CATEGORIA_LABEL[p.categoria]} • {TIPO_CHOCOLATE_LABEL[p.tipo_chocolate]} • {UNIDADE_LABEL[p.unidade]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-300">Quantidade</label>
            <Input value={qtd} onChange={(e) => setQtd(e.target.value)} inputMode="decimal" />
          </div>

          <div className="flex items-end">
            <Button type="submit" variant="primary" className="w-full">
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </span>
            </Button>
          </div>
        </form>

        {error && <div className="mt-3 text-sm text-red-200">{error}</div>}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3">Produto</th>
                <th className="hidden py-2 pr-3 sm:table-cell">Unidade</th>
                <th className="py-2 pr-3">Qtd</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((i) => (
                <tr key={i.productId} className="border-b border-white/5 last:border-b-0">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-slate-100">{i.nome}</div>
                    <div className="text-xs text-slate-400">
                      {CATEGORIA_LABEL[i.categoria]} • {TIPO_CHOCOLATE_LABEL[i.tipo_chocolate]}
                    </div>
                  </td>
                  <td className="hidden py-2 pr-3 text-slate-300 sm:table-cell">{UNIDADE_LABEL[i.unidade]}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" onClick={() => inc(i.productId, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        className="h-9 w-20 text-center sm:w-24"
                        value={qtyDrafts[`${loja}:${i.productId}`] ?? String(i.quantidade).replace(".", ",")}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQtyDrafts((prev) => ({ ...prev, [`${loja}:${i.productId}`]: v }));
                          setItemQtd(i.productId, v);
                        }}
                        onBlur={() => {
                          const key = `${loja}:${i.productId}`;
                          const draft = qtyDrafts[key];
                          if (draft !== undefined) {
                            const n = parseQtd(draft, i.unidade);
                            if (n !== null) setItemQtd(i.productId, draft);
                          }
                          setQtyDrafts((prev) => {
                            const { [key]: _, ...rest } = prev;
                            return rest;
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          (e.currentTarget as HTMLInputElement).blur();
                        }}
                        inputMode="decimal"
                      />
                      <Button type="button" onClick={() => inc(i.productId, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="py-2">
                    <Button type="button" variant="danger" onClick={() => removeItem(i.productId)}>
                      <span className="inline-flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Remover</span>
                      </span>
                    </Button>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                    Nenhum item no pedido.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <div className="text-xs text-slate-400">Prévia do texto (o botão copia tudo):</div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-[#111827] p-3 text-xs text-slate-200">
            {pedidoText}
          </pre>
        </div>
      </Card>

      <div className="print-only">
        <div className="print-page">
          <div className="print-header">
            <div className="print-title">Pedido das Lojas</div>
            <div className="print-meta">Gerado em {new Date().toLocaleString("pt-BR")}</div>
          </div>
          {pedidoPorLoja.map((secLoja) => (
            <div key={secLoja.lojaNome} className="print-section">
              <div className="print-section-title">{secLoja.lojaNome}</div>
              {secLoja.sections.map((sec) => (
                <div key={`${secLoja.lojaNome}-${sec.categoria}`} className="print-section">
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
          ))}
        </div>
      </div>
    </div>
  );
}
