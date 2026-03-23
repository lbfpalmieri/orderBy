import type { Product, ProductInsert, ProductUpdate } from "@/utils/domain";
import { createSupabaseClient, isSupabaseConfigured, supabase } from "@/utils/supabaseClient";
import { clearAdminPassword, getAdminHeaders } from "@/utils/adminAccess";

function assertConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  }
}

function mapWriteError(error: { message: string; code?: string | null; details?: string | null }) {
  const msg = error.message ?? "Erro ao salvar";
  if (error.code === "23505" || /products_nome_unique_ci/i.test(error.details ?? "")) {
    return "Já existe um produto com esse nome.";
  }
  if (error.code === "42501" || /row-level security policy/i.test(msg)) {
    clearAdminPassword();
    return "Acesso restrito: senha inválida ou expirada. Entre novamente em Acesso.";
  }
  return msg;
}

function getAdminClient() {
  const headers = getAdminHeaders();
  if (!headers) {
    throw new Error("Acesso restrito: digite a senha para gerenciar produtos.");
  }
  const client = createSupabaseClient(headers);
  if (!client) {
    throw new Error("Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  }
  return client;
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
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("products")
      .insert(input)
      .select("id,nome,categoria,unidade,peso_por_unidade_kg,tipo_chocolate,created_at,updated_at")
      .single();

    if (error) throw new Error(mapWriteError(error));
    return data as Product;
  },

  async update(id: string, patch: ProductUpdate): Promise<Product> {
    assertConfigured();
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("products")
      .update(patch)
      .eq("id", id)
      .select("id,nome,categoria,unidade,peso_por_unidade_kg,tipo_chocolate,created_at,updated_at")
      .single();

    if (error) throw new Error(mapWriteError(error));
    return data as Product;
  },

  async remove(id: string): Promise<void> {
    assertConfigured();
    const admin = getAdminClient();
    const { error } = await admin.from("products").delete().eq("id", id);
    if (error) throw new Error(mapWriteError(error));
  },
};
