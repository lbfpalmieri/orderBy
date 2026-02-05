import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  CATEGORIA_LABEL,
  TIPO_CHOCOLATE_LABEL,
  UNIDADE_LABEL,
  type CategoriaProduto,
  type Product,
  type TipoChocolate,
  type UnidadeProduto,
} from "@/utils/domain";
import { getSupabaseConfigError, isSupabaseConfigured } from "@/utils/supabaseClient";
import { useProductsStore } from "@/stores/productsStore";

const categoriaOptions = Object.entries(CATEGORIA_LABEL) as Array<[CategoriaProduto, string]>;
const unidadeOptions = Object.entries(UNIDADE_LABEL) as Array<[UnidadeProduto, string]>;
const chocolateOptions = Object.entries(TIPO_CHOCOLATE_LABEL) as Array<[TipoChocolate, string]>;

type FormState = {
  nome: string;
  categoria: CategoriaProduto;
  unidade: UnidadeProduto;
  peso_por_unidade_kg: string;
  tipo_chocolate: TipoChocolate;
};

function initialForm(): FormState {
  return {
    nome: "",
    categoria: "bombons",
    unidade: "saco",
    peso_por_unidade_kg: "",
    tipo_chocolate: "ao_leite",
  };
}

function normalizePeso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed.replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

export default function Produtos() {
  const supabaseError = getSupabaseConfigError();
  const { products, status, error, fetch, create, update, remove } = useProductsStore();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(initialForm());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  useEffect(() => {
    if (!editing) return;
    setForm({
      nome: editing.nome,
      categoria: editing.categoria,
      unidade: editing.unidade,
      peso_por_unidade_kg: editing.peso_por_unidade_kg ? String(editing.peso_por_unidade_kg) : "",
      tipo_chocolate: editing.tipo_chocolate,
    });
  }, [editing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.nome.toLowerCase().includes(q));
  }, [products, search]);

  async function onSubmit() {
    setFormError(null);
    const nome = form.nome.trim();
    if (!nome) return setFormError("Informe o nome do produto.");

    const peso = normalizePeso(form.peso_por_unidade_kg);
    if (form.unidade === "unidade" && (!peso || peso <= 0)) {
      return setFormError("Para unidade, informe o peso por unidade (kg).");
    }

    const payload = {
      nome,
      categoria: form.categoria,
      unidade: form.unidade,
      peso_por_unidade_kg: form.unidade === "unidade" ? peso : null,
      tipo_chocolate: form.tipo_chocolate,
    };

    try {
      if (editing) {
        await update(editing.id, payload);
      } else {
        await create(payload);
      }
      setEditing(null);
      setForm(initialForm());
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    try {
      await remove(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Produtos</h1>
        <p className="text-sm text-slate-400">Cadastre unidade, categoria e tipo de chocolate.</p>
      </div>

      {!isSupabaseConfigured && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="text-sm text-amber-200">{supabaseError}</div>
          <div className="mt-1 text-xs text-amber-200/70">
            Crie um arquivo <span className="font-mono">.env</span> com <span className="font-mono">VITE_SUPABASE_URL</span> e <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>.
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-100">Cadastro / Edição</div>
              <div className="text-xs text-slate-400">Nome + regras de unidade + chocolate.</div>
            </div>
            {editing && (
              <Button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(initialForm());
                  setFormError(null);
                }}
              >
                Cancelar
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300">Nome do produto</label>
              <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} placeholder="Ex.: Bombom Morango" />
            </div>

            <div>
              <label className="text-xs text-slate-300">Categoria</label>
              <select
                className="h-10 w-full rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-slate-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                value={form.categoria}
                onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value as CategoriaProduto }))}
              >
                {categoriaOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300">Tipo de chocolate</label>
              <select
                className="h-10 w-full rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-slate-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                value={form.tipo_chocolate}
                onChange={(e) => setForm((s) => ({ ...s, tipo_chocolate: e.target.value as TipoChocolate }))}
              >
                {chocolateOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300">Unidade</label>
              <select
                className="h-10 w-full rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-slate-100 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
                value={form.unidade}
                onChange={(e) => setForm((s) => ({ ...s, unidade: e.target.value as UnidadeProduto }))}
              >
                {unidadeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300">Peso por unidade (kg)</label>
              <Input
                value={form.peso_por_unidade_kg}
                onChange={(e) => setForm((s) => ({ ...s, peso_por_unidade_kg: e.target.value }))}
                placeholder={form.unidade === "unidade" ? "Ex.: 0,18" : "(não usado)"}
                disabled={form.unidade !== "unidade"}
              />
            </div>
          </div>

          {formError && <div className="mt-3 text-sm text-red-200">{formError}</div>}

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {status === "loading" ? "Carregando..." : error ? error : ""}
            </div>
            <Button type="button" variant="primary" onClick={onSubmit} disabled={!isSupabaseConfigured}>
              {editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-100">Produtos cadastrados</div>
              <div className="text-xs text-slate-400">Busca simples por nome.</div>
            </div>
            <div className="w-72 max-w-full">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." />
            </div>
          </div>

          <div className="mt-4">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="md:w-[34%] py-2 pr-3">Nome</th>
                  <th className="hidden md:table-cell md:w-[16%] py-2 pr-3">Categoria</th>
                  <th className="hidden md:table-cell md:w-[16%] py-2 pr-3">Chocolate</th>
                  <th className="hidden md:table-cell md:w-[16%] py-2 pr-3">Unidade</th>
                  <th className="hidden md:table-cell md:w-[10%] py-2 pr-3">Peso/unid</th>
                  <th className="md:w-[8%] py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-b-0">
                    <td className="py-2 pr-3 font-medium text-slate-100">
                      <div className="truncate" title={p.nome}>
                        {p.nome}
                      </div>
                      <div className="mt-0.5 text-xs font-normal text-slate-400 md:hidden">
                        {CATEGORIA_LABEL[p.categoria]} • {TIPO_CHOCOLATE_LABEL[p.tipo_chocolate]} • {UNIDADE_LABEL[p.unidade]}
                        {p.peso_por_unidade_kg ? ` • ${p.peso_por_unidade_kg}kg` : ""}
                      </div>
                    </td>
                    <td className="hidden py-2 pr-3 text-slate-300 md:table-cell">
                      <div className="truncate" title={CATEGORIA_LABEL[p.categoria]}>
                        {CATEGORIA_LABEL[p.categoria]}
                      </div>
                    </td>
                    <td className="hidden py-2 pr-3 text-slate-300 md:table-cell">
                      <div className="truncate" title={TIPO_CHOCOLATE_LABEL[p.tipo_chocolate]}>
                        {TIPO_CHOCOLATE_LABEL[p.tipo_chocolate]}
                      </div>
                    </td>
                    <td className="hidden py-2 pr-3 text-slate-300 md:table-cell">
                      <div className="truncate" title={UNIDADE_LABEL[p.unidade]}>
                        {UNIDADE_LABEL[p.unidade]}
                      </div>
                    </td>
                    <td className="hidden py-2 pr-3 text-slate-300 md:table-cell">
                      {p.peso_por_unidade_kg ? `${p.peso_por_unidade_kg}kg` : "—"}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" className="h-9 w-9 p-0" onClick={() => setEditing(p)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="danger" className="h-9 w-9 p-0" onClick={() => onDelete(p.id)} title="Remover">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
