import type { Product, ProductInsert, ProductUpdate } from "@/utils/domain";
import { isSupabaseConfigured, supabase } from "@/utils/supabaseClient";

function assertConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  }
}

export const productsApi = {
  async list(): Promise<Product[]> {
    assertConfigured();
    const { data, error } = await supabase!
      .from("products")
      .select("id,nome,categoria,unidade,peso_por_unidade_kg,tipo_chocolate,created_at,updated_at")
      .order("categoria", { ascending: true })
      .order("nome", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Product[];
  },

  async create(input: ProductInsert): Promise<Product> {
    assertConfigured();
    const { data, error } = await supabase!
      .from("products")
      .insert(input)
      .select("id,nome,categoria,unidade,peso_por_unidade_kg,tipo_chocolate,created_at,updated_at")
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  async update(id: string, patch: ProductUpdate): Promise<Product> {
    assertConfigured();
    const { data, error } = await supabase!
      .from("products")
      .update(patch)
      .eq("id", id)
      .select("id,nome,categoria,unidade,peso_por_unidade_kg,tipo_chocolate,created_at,updated_at")
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  async remove(id: string): Promise<void> {
    assertConfigured();
    const { error } = await supabase!.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
