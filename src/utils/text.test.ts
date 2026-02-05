import { describe, expect, it } from "vitest";
import { parsePedidoLine } from "@/utils/text";

describe("parsePedidoLine", () => {
  it("interpreta sufixo 1s", () => {
    const parsed = parsePedidoLine("Bombom Explosivo 1s");
    expect(parsed.kind).toBe("item");
    if (parsed.kind !== "item") throw new Error("expected item");
    expect(parsed.nameRaw).toBe("Bombom Explosivo");
    expect(parsed.qty).toBe(1);
    expect(parsed.unitHint).toBe("saco");
  });

  it("interpreta unidades no final", () => {
    const parsed = parsePedidoLine("Urso ao leite 150 unidades");
    expect(parsed.kind).toBe("item");
    if (parsed.kind !== "item") throw new Error("expected item");
    expect(parsed.nameRaw).toBe("Urso ao leite");
    expect(parsed.qty).toBe(150);
    expect(parsed.unitHint).toBe("unidade");
  });

  it("ignora cabeçalhos", () => {
    const parsed = parsePedidoLine("Loja 5 precisa");
    expect(parsed.kind).toBe("skip");
  });
});

