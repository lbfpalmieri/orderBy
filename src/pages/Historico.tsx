import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCopy, Eye, History } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { buildPedidoText } from "@/utils/pedidoText";
import {
  clearPedidoHistorico,
  compactPedidoHistorico,
  loadPedidoHistorico,
  PEDIDOS_HISTORICO_KEY,
  type PedidoHistoricoEntry,
} from "@/utils/pedidoHistorico";
import {
  clearOrderHistoryCloudConfigured,
  compactOrderHistoryCloudConfigured,
  getConfiguredWorkspaceKey,
  isValidWorkspaceKey,
  listOrderHistoryCloudConfigured,
} from "@/utils/orderHistoryCloud";
import { isSupabaseConfigured } from "@/utils/supabaseClient";

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmdToMsStart(ymd: string) {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(y, mo - 1, d, 0, 0, 0, 0).getTime();
}

function parseYmdToMsEnd(ymd: string) {
  const start = parseYmdToMsStart(ymd);
  if (start === null) return null;
  return start + 24 * 60 * 60 * 1000 - 1;
}

function countItems(entry: PedidoHistoricoEntry) {
  let lojas = 0;
  let itens = 0;
  for (const list of Object.values(entry.itemsByLoja)) {
    const n = list?.length ?? 0;
    if (n > 0) {
      lojas++;
      itens += n;
    }
  }
  return { lojas, itens };
}

export default function Historico() {
  const [all, setAll] = useState<PedidoHistoricoEntry[]>(() => loadPedidoHistorico());
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 21);
    return toYmd(d);
  });
  const [to, setTo] = useState(() => toYmd(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [compacted, setCompacted] = useState(false);
  const workspaceKey = getConfiguredWorkspaceKey();
  const useCloud = isSupabaseConfigured && isValidWorkspaceKey(workspaceKey);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (useCloud) return;
    if (!compacted) {
      try {
        compactPedidoHistorico();
      } catch {
      }
      setAll(loadPedidoHistorico());
      setCompacted(true);
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== PEDIDOS_HISTORICO_KEY) return;
      setAll(loadPedidoHistorico());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [compacted, useCloud]);

  useEffect(() => {
    if (!useCloud) return;
    const start = from ? parseYmdToMsStart(from) : null;
    const end = to ? parseYmdToMsEnd(to) : null;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const rows = await listOrderHistoryCloudConfigured({
          from: start !== null ? new Date(start) : null,
          to: end !== null ? new Date(end) : null,
        });
        const mapped: PedidoHistoricoEntry[] = rows.map((r) => ({
          id: r.id,
          createdAt: new Date(r.created_at).getTime(),
          lojaFallback: r.loja_fallback,
          text: r.text,
          itemsByLoja: r.items_by_loja,
        }));
        setAll(mapped);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Falha ao carregar histórico");
        setAll([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, useCloud, workspaceKey]);

  const range = useMemo(() => {
    const start = from ? parseYmdToMsStart(from) : null;
    const end = to ? parseYmdToMsEnd(to) : null;
    return { start, end };
  }, [from, to]);

  const filtered = useMemo(() => {
    const out = [...all].sort((a, b) => b.createdAt - a.createdAt);
    const { start, end } = range;
    return out.filter((e) => {
      if (start !== null && e.createdAt < start) return false;
      if (end !== null && e.createdAt > end) return false;
      return true;
    });
  }, [all, range]);

  const openEntry = useMemo(() => {
    if (!openId) return null;
    return all.find((e) => e.id === openId) ?? null;
  }, [all, openId]);

  async function copyText(text: string, id: string | null) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="screen-only">
        <h1 className="text-2xl font-semibold text-slate-100">Histórico</h1>
        <p className="text-sm text-slate-400">Consulte pedidos anteriores e filtre por período.</p>
      </div>

      <Card className="screen-only">
        <div className="mb-4 text-xs text-slate-400">
          {useCloud
            ? "Histórico online ativo."
            : "Histórico local. Para ativar online, defina VITE_ORDER_HISTORY_WORKSPACE_KEY (mín. 16 caracteres) no ambiente do app."}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-300">De</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-300">Até</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setFrom(toYmd(d));
                setTo(toYmd(new Date()));
              }}
            >
              <CalendarDays className="h-4 w-4" />
              7 dias
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 14);
                setFrom(toYmd(d));
                setTo(toYmd(new Date()));
              }}
            >
              14 dias
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                setFrom(toYmd(d));
                setTo(toYmd(new Date()));
              }}
            >
              30 dias
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Tudo
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const ok = confirm("Remover entradas duplicadas do histórico?");
                if (!ok) return;
                if (useCloud) {
                  void (async () => {
                    try {
                      await compactOrderHistoryCloudConfigured();
                      const rows = await listOrderHistoryCloudConfigured({ from: null, to: null });
                      const mapped: PedidoHistoricoEntry[] = rows.map((r) => ({
                        id: r.id,
                        createdAt: new Date(r.created_at).getTime(),
                        lojaFallback: r.loja_fallback,
                        text: r.text,
                        itemsByLoja: r.items_by_loja,
                      }));
                      setAll(mapped);
                    } catch {
                    }
                  })();
                  return;
                }
                try {
                  compactPedidoHistorico();
                } catch {
                }
                setAll(loadPedidoHistorico());
              }}
            >
              Remover duplicados
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                const ok = confirm("Limpar todo o histórico de pedidos?");
                if (!ok) return;
                if (useCloud) {
                  void (async () => {
                    try {
                      await clearOrderHistoryCloudConfigured();
                    } catch {
                    }
                    setOpenId(null);
                    setAll([]);
                  })();
                  return;
                }
                try {
                  clearPedidoHistorico();
                } catch {
                }
                setOpenId(null);
                setAll([]);
              }}
            >
              Limpar histórico
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="screen-only">
          <div className="text-sm text-slate-200">Carregando histórico...</div>
        </Card>
      ) : loadError ? (
        <Card className="screen-only">
          <div className="text-sm text-slate-200">{loadError}</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="screen-only">
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <History className="h-5 w-5 text-slate-300" />
            Nenhum pedido salvo no histórico neste período.
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((e) => {
            const { lojas, itens } = countItems(e);
            const title = new Date(e.createdAt).toLocaleString("pt-BR");
            return (
              <Card key={e.id} className="screen-only">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{title}</div>
                    <div className="text-xs text-slate-400">
                      {lojas} loja(s) • {itens} item(ns)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" className="gap-2" onClick={() => setOpenId(e.id)}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                    <Button type="button" className="gap-2" onClick={() => void copyText(e.text, e.id)}>
                      <ClipboardCopy className="h-4 w-4" />
                      {copiedId === e.id ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!openEntry}
        title={openEntry ? new Date(openEntry.createdAt).toLocaleString("pt-BR") : undefined}
        description={openEntry ? `${countItems(openEntry).lojas} loja(s) • ${countItems(openEntry).itens} item(ns)` : undefined}
        onClose={() => setOpenId(null)}
        className="max-w-3xl"
        footer={
          openEntry ? (
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpenId(null)}>
                Fechar
              </Button>
              <Button type="button" onClick={() => void copyText(openEntry.text, openEntry.id)}>
                {copiedId === openEntry.id ? "Copiado" : "Copiar"}
              </Button>
            </div>
          ) : null
        }
      >
        {openEntry && (
          <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-slate-100">
            {openEntry.text || buildPedidoText(openEntry.itemsByLoja, openEntry.lojaFallback)}
          </pre>
        )}
      </Modal>
    </div>
  );
}
