import { describe, expect, it, vi } from "vitest";
import { appendPedidoHistorico, loadPedidoHistorico, PEDIDOS_HISTORICO_KEY } from "@/utils/pedidoHistorico";

function setNow(ms: number) {
  vi.setSystemTime(new Date(ms));
}

describe("pedidoHistorico", () => {
  it("não duplica o mesmo texto em janela curta", () => {
    const store = new Map<string, string>();
    const getItem = vi.fn((k: string) => store.get(k) ?? null);
    const setItem = vi.fn((k: string, v: string) => {
      store.set(k, v);
    });
    vi.stubGlobal("localStorage", { getItem, setItem } as unknown as Storage);

    const base = 1_700_000_000_000;
    setNow(base);
    const first = appendPedidoHistorico({
      createdAt: base,
      lojaFallback: "Loja 5",
      text: "Pedido A",
      itemsByLoja: {},
    });
    expect(first).not.toBeNull();
    expect(loadPedidoHistorico()).toHaveLength(1);

    setNow(base + 10 * 60 * 1000);
    const second = appendPedidoHistorico({
      createdAt: base + 10 * 60 * 1000,
      lojaFallback: "Loja 5",
      text: "Pedido A",
      itemsByLoja: {},
    });
    expect(second).toBeNull();
    expect(loadPedidoHistorico()).toHaveLength(1);
    expect(getItem).toHaveBeenCalledWith(PEDIDOS_HISTORICO_KEY);
    expect(setItem).toHaveBeenCalled();
  });

  it("permite salvar o mesmo texto em janela longa (ex.: semana seguinte)", () => {
    const store = new Map<string, string>();
    const getItem = vi.fn((k: string) => store.get(k) ?? null);
    const setItem = vi.fn((k: string, v: string) => {
      store.set(k, v);
    });
    vi.stubGlobal("localStorage", { getItem, setItem } as unknown as Storage);

    const base = 1_700_000_000_000;
    setNow(base);
    appendPedidoHistorico({
      createdAt: base,
      lojaFallback: "Loja 5",
      text: "Pedido B",
      itemsByLoja: {},
    });
    expect(loadPedidoHistorico()).toHaveLength(1);

    setNow(base + 8 * 24 * 60 * 60 * 1000);
    const saved = appendPedidoHistorico({
      createdAt: base + 8 * 24 * 60 * 60 * 1000,
      lojaFallback: "Loja 5",
      text: "Pedido B",
      itemsByLoja: {},
    });
    expect(saved).not.toBeNull();
    expect(loadPedidoHistorico()).toHaveLength(2);
  });
});

