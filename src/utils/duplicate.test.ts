import { describe, expect, it } from "vitest";
import { findSimilarByName, jaccardSimilarity, tokenizeForDuplicate } from "@/utils/duplicate";

describe("duplicate utils", () => {
  it("tokenizeForDuplicate remove acentos e stopwords", () => {
    expect(tokenizeForDuplicate("Bombom maracujá")).toEqual(["bombom", "maracuja"]);
    expect(tokenizeForDuplicate("Bombom de maracuja")).toEqual(["bombom", "maracuja"]);
  });

  it("jaccardSimilarity funciona", () => {
    expect(jaccardSimilarity(["a", "b"], ["a", "b"])).toBe(1);
    expect(jaccardSimilarity(["a", "b"], ["a"])).toBe(0.5);
    expect(jaccardSimilarity([], ["a"])).toBe(0);
  });

  it("findSimilarByName encontra duplicidade provável", () => {
    const items = [{ nome: "Bombom maracujá" }, { nome: "Barra ao leite" }];
    const matches = findSimilarByName("Bombom de maracuja", items, (i) => i.nome, { minScore: 0.85 });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].item.nome).toBe("Bombom maracujá");
    expect(matches[0].score).toBe(1);
  });
});

