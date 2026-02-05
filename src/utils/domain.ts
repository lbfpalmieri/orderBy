export type UnidadeProduto = "saco" | "kg" | "unidade";
export type TipoChocolate = "ao_leite" | "branco" | "meio_amargo" | "70" | "diet";
export type CategoriaProduto = "bombons" | "barras" | "trufas" | "ursos" | "licores" | "outros";

export const UNIDADE_LABEL: Record<UnidadeProduto, string> = {
  saco: "Saco (2kg)",
  kg: "Kg",
  unidade: "Unidade",
};

export const CATEGORIA_LABEL: Record<CategoriaProduto, string> = {
  bombons: "Bombons",
  barras: "Barras",
  trufas: "Trufas",
  ursos: "Ursos",
  licores: "Licores",
  outros: "Outros",
};

export const TIPO_CHOCOLATE_LABEL: Record<TipoChocolate, string> = {
  ao_leite: "Ao leite",
  branco: "Branco",
  meio_amargo: "Meio amargo",
  "70": "70%",
  diet: "Diet",
};

export const SACO_PESO_PADRAO_KG = 2;

export type Product = {
  id: string;
  nome: string;
  categoria: CategoriaProduto;
  unidade: UnidadeProduto;
  peso_por_unidade_kg: number | null;
  tipo_chocolate: TipoChocolate;
  created_at?: string;
  updated_at?: string;
};

export type ProductInsert = {
  nome: string;
  categoria: CategoriaProduto;
  unidade: UnidadeProduto;
  peso_por_unidade_kg: number | null;
  tipo_chocolate: TipoChocolate;
};

export type ProductUpdate = Partial<ProductInsert>;

export type PedidoItem = {
  productId: string;
  nome: string;
  categoria: CategoriaProduto;
  unidade: UnidadeProduto;
  tipo_chocolate: TipoChocolate;
  peso_por_unidade_kg: number | null;
  quantidade: number;
};

