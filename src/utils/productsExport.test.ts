import { describe, expect, it } from "vitest";
import type { Product } from "@/utils/domain";
import { buildProductsExportEnvelope, productsToCsv } from "@/utils/productsExport";

describe("productsExport", () => {
  const sample: Product[] = [
    {
      id: "1",
      nome: 'Barra "Ao leite", grande',
      categoria: "barras",
      unidade: "saco",
      peso_por_unidade_kg: null,
      tipo_chocolate: "ao_leite",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      nome: "Trufa Morango",
      categoria: "trufas",
      unidade: "unidade",
      peso_por_unidade_kg: 0.18,
      tipo_chocolate: "branco",
    },
  ];

  it("gera envelope JSON com versão e campos portáveis", () => {
    const env = buildProductsExportEnvelope(sample);
    expect(env.version).toBe(1);
    expect(typeof env.exported_at).toBe("string");
    expect(env.products).toEqual([
      {
        nome: 'Barra "Ao leite", grande',
        categoria: "barras",
        unidade: "saco",
        peso_por_unidade_kg: null,
        tipo_chocolate: "ao_leite",
      },
      {
        nome: "Trufa Morango",
        categoria: "trufas",
        unidade: "unidade",
        peso_por_unidade_kg: 0.18,
        tipo_chocolate: "branco",
      },
    ]);
  });

  it("gera CSV com escaping e newline final", () => {
    const csv = productsToCsv(sample);
    const lines = csv.trimEnd().split("\n");
    expect(lines[0]).toBe("nome,categoria,unidade,peso_por_unidade_kg,tipo_chocolate");
    expect(lines[1]).toBe('"Barra ""Ao leite"", grande",barras,saco,,ao_leite');
    expect(lines[2]).toBe("Trufa Morango,trufas,unidade,0.18,branco");
    expect(csv.endsWith("\n")).toBe(true);
  });
});

