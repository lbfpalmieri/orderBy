import { normalizeText } from "@/utils/text";

const STOPWORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "pra",
  "pro",
  "sem",
]);

export function tokenizeForDuplicate(name: string) {
  const n = normalizeText(name).replace(/[^a-z0-9]+/g, " ").trim();
  if (!n) return [];
  const tokens = n
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  return Array.from(new Set(tokens)).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function jaccardSimilarity(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

export type SimilarNameMatch<T> = {
  item: T;
  score: number;
  reason: "tokens" | "substring";
};

export function findSimilarByName<T>(
  inputName: string,
  items: T[],
  getName: (item: T) => string,
  options?: { minScore?: number; maxResults?: number },
): SimilarNameMatch<T>[] {
  const minScore = options?.minScore ?? 0.85;
  const maxResults = options?.maxResults ?? 5;

  const inputTokens = tokenizeForDuplicate(inputName);
  const inputNorm = normalizeText(inputName).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

  const ranked: SimilarNameMatch<T>[] = [];
  for (const item of items) {
    const name = getName(item);
    const norm = normalizeText(name).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    if (!norm) continue;

    const tokens = tokenizeForDuplicate(name);
    const scoreTokens = jaccardSimilarity(inputTokens, tokens);
    if (scoreTokens >= minScore) {
      ranked.push({ item, score: scoreTokens, reason: "tokens" });
      continue;
    }

    if (inputNorm && (norm.includes(inputNorm) || inputNorm.includes(norm))) {
      ranked.push({ item, score: 0.8, reason: "substring" });
    }
  }

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

