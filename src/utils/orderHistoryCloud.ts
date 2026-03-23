import type { ItemsByLoja } from "@/utils/pedidoText";
import { supabase } from "@/utils/supabaseClient";

export const ORDER_HISTORY_WORKSPACE_KEY = (import.meta.env.VITE_ORDER_HISTORY_WORKSPACE_KEY as string | undefined) ?? "";

export type CloudOrderHistoryRow = {
  id: string;
  workspace_key: string;
  loja_fallback: string;
  text: string;
  items_by_loja: ItemsByLoja;
  created_at: string;
};

export function isValidWorkspaceKey(value: string) {
  return value.trim().length >= 16;
}

export function getConfiguredWorkspaceKey() {
  return ORDER_HISTORY_WORKSPACE_KEY.trim();
}

export async function listOrderHistoryCloud(params: { workspaceKey: string; from?: Date | null; to?: Date | null }) {
  if (!supabase) throw new Error("Supabase não configurado");
  const workspaceKey = params.workspaceKey.trim();
  if (!isValidWorkspaceKey(workspaceKey)) throw new Error("workspace_key inválida");

  const { data, error } = await supabase.rpc("list_order_history", {
    p_workspace_key: workspaceKey,
    p_from: params.from ? params.from.toISOString() : null,
    p_to: params.to ? params.to.toISOString() : null,
  });
  if (error) throw error;
  return (data ?? []) as CloudOrderHistoryRow[];
}

export async function listOrderHistoryCloudConfigured(params: { from?: Date | null; to?: Date | null }) {
  return listOrderHistoryCloud({ workspaceKey: getConfiguredWorkspaceKey(), from: params.from, to: params.to });
}

export async function saveOrderHistoryCloud(params: {
  workspaceKey: string;
  lojaFallback: string;
  text: string;
  itemsByLoja: ItemsByLoja;
  createdAt: Date;
}) {
  if (!supabase) throw new Error("Supabase não configurado");
  const workspaceKey = params.workspaceKey.trim();
  if (!isValidWorkspaceKey(workspaceKey)) throw new Error("workspace_key inválida");

  const { data, error } = await supabase.rpc("save_order_history", {
    p_workspace_key: workspaceKey,
    p_loja_fallback: params.lojaFallback,
    p_text: params.text,
    p_items_by_loja: params.itemsByLoja,
    p_created_at: params.createdAt.toISOString(),
  });
  if (error) throw error;
  return data as string | null;
}

export async function saveOrderHistoryCloudConfigured(params: {
  lojaFallback: string;
  text: string;
  itemsByLoja: ItemsByLoja;
  createdAt: Date;
}) {
  return saveOrderHistoryCloud({
    workspaceKey: getConfiguredWorkspaceKey(),
    lojaFallback: params.lojaFallback,
    text: params.text,
    itemsByLoja: params.itemsByLoja,
    createdAt: params.createdAt,
  });
}

export async function clearOrderHistoryCloud(workspaceKey: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const key = workspaceKey.trim();
  if (!isValidWorkspaceKey(key)) throw new Error("workspace_key inválida");
  const { data, error } = await supabase.rpc("clear_order_history", { p_workspace_key: key });
  if (error) throw error;
  return data as number;
}

export async function clearOrderHistoryCloudConfigured() {
  return clearOrderHistoryCloud(getConfiguredWorkspaceKey());
}

export async function compactOrderHistoryCloud(workspaceKey: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const key = workspaceKey.trim();
  if (!isValidWorkspaceKey(key)) throw new Error("workspace_key inválida");
  const { data, error } = await supabase.rpc("compact_order_history", { p_workspace_key: key });
  if (error) throw error;
  return data as number;
}

export async function compactOrderHistoryCloudConfigured() {
  return compactOrderHistoryCloud(getConfiguredWorkspaceKey());
}
