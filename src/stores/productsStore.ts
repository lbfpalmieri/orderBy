import { create } from "zustand";
import type { Product, ProductInsert, ProductUpdate } from "@/utils/domain";
import { productsApi } from "@/utils/productsApi";

type ProductsState = {
  products: Product[];
  status: "idle" | "loading" | "error";
  error: string | null;
  fetch: () => Promise<void>;
  create: (input: ProductInsert) => Promise<Product>;
  update: (id: string, patch: ProductUpdate) => Promise<Product>;
  remove: (id: string) => Promise<void>;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  status: "idle",
  error: null,

  fetch: async () => {
    set({ status: "loading", error: null });
    try {
      const products = await productsApi.list();
      set({ products, status: "idle" });
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Erro ao buscar produtos" });
    }
  },

  create: async (input) => {
    const created = await productsApi.create(input);
    set({ products: [...get().products, created].sort((a, b) => a.nome.localeCompare(b.nome)) });
    return created;
  },

  update: async (id, patch) => {
    const updated = await productsApi.update(id, patch);
    set({ products: get().products.map((p) => (p.id === id ? updated : p)) });
    return updated;
  },

  remove: async (id) => {
    await productsApi.remove(id);
    set({ products: get().products.filter((p) => p.id !== id) });
  },
}));

