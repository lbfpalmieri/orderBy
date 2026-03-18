import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { isSupabaseConfigured, createSupabaseClient } from "@/utils/supabaseClient";
import { setAdminPassword } from "@/utils/adminAccess";

function normalizeNext(raw: string | null) {
  if (!raw) return "/produtos";
  if (!raw.startsWith("/")) return "/produtos";
  if (raw.startsWith("//")) return "/produtos";
  return raw;
}

export default function Acesso() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = useMemo(() => normalizeNext(params.get("next")), [params]);

  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function validar() {
    setError(null);
    const value = senha.trim();
    if (!value) return setError("Informe a senha.");

    if (!isSupabaseConfigured) {
      if (value !== "445") return setError("Senha inválida.");
      setAdminPassword(value);
      navigate(next, { replace: true });
      return;
    }

    setLoading(true);
    try {
      const client = createSupabaseClient({ "x-admin-password": value });
      if (!client) throw new Error("Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");

      const { data, error } = await client.rpc("check_admin_password");
      if (error) throw new Error(error.message);
      if (data !== true) {
        setError("Senha inválida.");
        return;
      }

      setAdminPassword(value);
      navigate(next, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao validar a senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <LockKeyhole className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold text-slate-100">Acesso restrito</div>
            <div className="mt-1 text-sm text-slate-400">
              Para acessar Produtos e Fábrica, digite a senha.
            </div>
          </div>
        </div>

        <form
          className="mt-5 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void validar();
          }}
        >
          <div>
            <label className="text-xs text-slate-300">Senha</label>
            <Input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="•••"
            />
          </div>

          {error && <div className="text-sm text-red-200">{error}</div>}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => navigate("/loja")} disabled={loading}>
              Ir para Loja
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Validando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
