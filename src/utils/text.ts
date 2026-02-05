export function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function parseNumberPt(value: string) {
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function isIgnorableLine(line: string) {
  const n = normalizeText(line);
  if (!n) return true;
  if (n.startsWith("pedido")) return true;
  if (n.startsWith("loja ")) return true;
  if (n === "bombons" || n === "barras" || n === "trufas" || n === "ursos" || n === "licores") return true;
  if (n === "precisa" || n === "fabrica" || n === "fabrica precisa" || n === "preciso") return true;
  return false;
}

export type ParsedLine =
  | { kind: "item"; nameRaw: string; qty: number | null; unitHint: "saco" | "kg" | "unidade" | null }
  | { kind: "skip" }
  | { kind: "invalid"; reason: string };

export function parsePedidoLine(line: string): ParsedLine {
  const raw = line.trim();
  if (!raw) return { kind: "skip" };
  if (isIgnorableLine(raw)) return { kind: "skip" };

  const end = raw.match(/^(.*?)(?:\s+)(\d+(?:[.,]\d+)?)(?:\s*)(s|kg|un|unid\.?|unidade|unidades)\b/i);
  if (end) {
    const nameRaw = end[1].trim();
    const qty = parseNumberPt(end[2]);
    if (!nameRaw) return { kind: "invalid", reason: "Sem nome" };
    if (!qty || qty <= 0) return { kind: "invalid", reason: "Quantidade inválida" };

    const unitToken = normalizeText(end[3]);
    const unitHint = unitToken === "kg" ? "kg" : unitToken === "s" ? "saco" : "unidade";
    return { kind: "item", nameRaw, qty, unitHint };
  }

  const start = raw.match(/^(\d+(?:[.,]\d+)?)(?:\s+)(.+)$/);
  if (start) {
    const qty = parseNumberPt(start[1]);
    const nameRaw = start[2].trim();
    if (!nameRaw) return { kind: "invalid", reason: "Sem nome" };
    if (!qty || qty <= 0) return { kind: "invalid", reason: "Quantidade inválida" };
    return { kind: "item", nameRaw, qty, unitHint: null };
  }

  return { kind: "item", nameRaw: raw, qty: null, unitHint: null };
}

