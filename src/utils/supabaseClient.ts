import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function createSupabaseClient(extraHeaders?: Record<string, string>) {
  if (!url || !anonKey) return null;
  if (!extraHeaders) return createClient(url, anonKey);
  return createClient(url, anonKey, { global: { headers: extraHeaders } });
}

export function getSupabaseConfigError() {
  if (!url) return "Defina VITE_SUPABASE_URL no seu .env";
  if (!anonKey) return "Defina VITE_SUPABASE_ANON_KEY no seu .env";
  return null;
}

export const isSupabaseConfigured = !getSupabaseConfigError();

export const supabase = isSupabaseConfigured ? createSupabaseClient() : null;
