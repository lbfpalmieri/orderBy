import type { Product } from "@/utils/domain";

type ExportEnvelopeV1 = {
  version: 1;
  exported_at: string;
  products: Array<{
    nome: string;
    categoria: Product["categoria"];
    unidade: Product["unidade"];
    peso_por_unidade_kg: number | null;
    tipo_chocolate: Product["tipo_chocolate"];
  }>;
};

function isoNow() {
  return new Date().toISOString();
}

function safeFilenameDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildProductsExportEnvelope(products: Product[]): ExportEnvelopeV1 {
  return {
    version: 1,
    exported_at: isoNow(),
    products: products.map((p) => ({
      nome: p.nome,
      categoria: p.categoria,
      unidade: p.unidade,
      peso_por_unidade_kg: p.peso_por_unidade_kg ?? null,
      tipo_chocolate: p.tipo_chocolate,
    })),
  };
}

export function exportProductsJson(products: Product[]) {
  const envelope = buildProductsExportEnvelope(products);
  const content = JSON.stringify(envelope, null, 2);
  const filename = `produtos-${safeFilenameDate()}.json`;
  downloadTextFile(filename, content, "application/json;charset=utf-8");
}

function csvEscape(value: string) {
  const needsQuote = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function productsToCsv(products: Product[]) {
  const header = ["nome", "categoria", "unidade", "peso_por_unidade_kg", "tipo_chocolate"];
  const lines = [header.join(",")];
  for (const p of products) {
    const row = [
      csvEscape(p.nome),
      csvEscape(p.categoria),
      csvEscape(p.unidade),
      p.peso_por_unidade_kg == null ? "" : String(p.peso_por_unidade_kg),
      csvEscape(p.tipo_chocolate),
    ];
    lines.push(row.join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function exportProductsCsv(products: Product[]) {
  const content = productsToCsv(products);
  const filename = `produtos-${safeFilenameDate()}.csv`;
  downloadTextFile(filename, content, "text/csv;charset=utf-8");
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

