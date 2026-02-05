import type { PedidoItem, TipoChocolate } from "@/utils/domain";
import { SACO_PESO_PADRAO_KG } from "@/utils/domain";

export type TotaisPedido = {
  totalSacos: number;
  totalKg: number;
  kgPorChocolate: Record<TipoChocolate, number>;
  itensSemPesoUnidade: number;
};

const chocolateKeys: TipoChocolate[] = ["ao_leite", "branco", "meio_amargo", "70", "diet"];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function calcularTotais(items: PedidoItem[]): TotaisPedido {
  let totalSacos = 0;
  let totalKg = 0;
  let itensSemPesoUnidade = 0;
  const kgPorChocolate = chocolateKeys.reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<TipoChocolate, number>,
  );

  for (const item of items) {
    const qtd = item.quantidade;
    if (!Number.isFinite(qtd) || qtd <= 0) continue;

    let kgItem = 0;
    if (item.unidade === "kg") {
      kgItem = qtd;
    } else if (item.unidade === "saco") {
      totalSacos += qtd;
      kgItem = qtd * SACO_PESO_PADRAO_KG;
    } else {
      const peso = item.peso_por_unidade_kg;
      if (!peso || peso <= 0) {
        itensSemPesoUnidade += 1;
        kgItem = 0;
      } else {
        kgItem = qtd * peso;
      }
    }

    totalKg += kgItem;
    kgPorChocolate[item.tipo_chocolate] = (kgPorChocolate[item.tipo_chocolate] ?? 0) + kgItem;
  }

  return {
    totalSacos: round2(totalSacos),
    totalKg: round2(totalKg),
    kgPorChocolate: chocolateKeys.reduce(
      (acc, key) => ({ ...acc, [key]: round2(kgPorChocolate[key] ?? 0) }),
      {} as Record<TipoChocolate, number>,
    ),
    itensSemPesoUnidade,
  };
}

