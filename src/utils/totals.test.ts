import { describe, expect, it } from "vitest";
import { calcularTotais } from "@/utils/totals";
import type { PedidoItem } from "@/utils/domain";

describe("calcularTotais", () => {
  it("calcula sacos e kg a partir de saco/kg/unidade", () => {
    const items: PedidoItem[] = [
      {
        productId: "1",
        nome: "Bombom Morango",
        categoria: "bombons",
        unidade: "saco",
        tipo_chocolate: "ao_leite",
        peso_por_unidade_kg: null,
        quantidade: 2,
      },
      {
        productId: "2",
        nome: "Chocolate Branco",
        categoria: "outros",
        unidade: "kg",
        tipo_chocolate: "branco",
        peso_por_unidade_kg: null,
        quantidade: 1.5,
      },
      {
        productId: "3",
        nome: "Urso",
        categoria: "ursos",
        unidade: "unidade",
        tipo_chocolate: "ao_leite",
        peso_por_unidade_kg: 0.2,
        quantidade: 10,
      },
    ];

    const totals = calcularTotais(items);
    expect(totals.totalSacos).toBe(2);
    expect(totals.totalKg).toBe(7.5);
    expect(totals.kgPorChocolate.ao_leite).toBe(6);
    expect(totals.kgPorChocolate.branco).toBe(1.5);
  });

  it("contabiliza itens por unidade sem peso como ausentes", () => {
    const items: PedidoItem[] = [
      {
        productId: "1",
        nome: "Urso",
        categoria: "ursos",
        unidade: "unidade",
        tipo_chocolate: "ao_leite",
        peso_por_unidade_kg: null,
        quantidade: 10,
      },
    ];

    const totals = calcularTotais(items);
    expect(totals.totalKg).toBe(0);
    expect(totals.itensSemPesoUnidade).toBe(1);
  });
});

