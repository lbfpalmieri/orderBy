import type { ItemsByLoja } from "@/utils/pedidoText";

export const PEDIDOS_HISTORICO_KEY = "pedidos_historico_v1";
const DEDUP_WINDOW_MS = 12 * 60 * 60 * 1000;

export type PedidoHistoricoEntry = {
  id: string;
  createdAt: number;
  lojaFallback: string;
  text: string;
  itemsByLoja: ItemsByLoja;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function safeParseHistorico(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: PedidoHistoricoEntry[] = [];
    for (const it of parsed) {
      if (!isRecord(it)) continue;
      const id = it.id;
      const createdAt = it.createdAt;
      const lojaFallback = it.lojaFallback;
      const text = it.text;
      const itemsByLoja = it.itemsByLoja;
      if (typeof id !== "string" || !id) continue;
      if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) continue;
      if (typeof lojaFallback !== "string" || !lojaFallback) continue;
      if (typeof text !== "string" || !text) continue;
      if (!isRecord(itemsByLoja)) continue;
      out.push({ id, createdAt, lojaFallback, text, itemsByLoja: itemsByLoja as ItemsByLoja });
    }
    return out;
  } catch {
    return [];
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function loadPedidoHistorico() {
  return safeParseHistorico(localStorage.getItem(PEDIDOS_HISTORICO_KEY));
}

export function savePedidoHistorico(entries: PedidoHistoricoEntry[]) {
  localStorage.setItem(PEDIDOS_HISTORICO_KEY, JSON.stringify(entries));
}

export function appendPedidoHistorico(entry: Omit<PedidoHistoricoEntry, "id"> & { id?: string }) {
  const all = loadPedidoHistorico();
  const recentSameText = all.find((e) => e.text === entry.text && Math.abs(entry.createdAt - e.createdAt) < DEDUP_WINDOW_MS) ?? null;
  if (recentSameText) return null;
  const next: PedidoHistoricoEntry = {
    id: entry.id ?? makeId(),
    createdAt: entry.createdAt,
    lojaFallback: entry.lojaFallback,
    text: entry.text,
    itemsByLoja: entry.itemsByLoja,
  };
  const merged = dedupeHistorico([next, ...all]).slice(0, 300);
  savePedidoHistorico(merged);
  return next;
}

function dedupeHistorico(entries: PedidoHistoricoEntry[]) {
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
  const lastByText = new Map<string, number>();
  const out: PedidoHistoricoEntry[] = [];
  for (const e of sorted) {
    const last = lastByText.get(e.text) ?? null;
    if (last !== null && Math.abs(e.createdAt - last) < DEDUP_WINDOW_MS) continue;
    lastByText.set(e.text, e.createdAt);
    out.push(e);
  }
  return out;
}

