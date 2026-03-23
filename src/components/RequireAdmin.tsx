import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearAdminPassword, getAdminPassword } from "@/utils/adminAccess";
import { createSupabaseClient, isSupabaseConfigured } from "@/utils/supabaseClient";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const next = useMemo(() => encodeURIComponent(`${location.pathname}${location.search}`), [location.pathname, location.search]);
  const password = getAdminPassword();

  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(() => {
    if (!password) return "denied";
    if (!isSupabaseConfigured) return password === "445" ? "allowed" : "denied";
    return "checking";
  });

  useEffect(() => {
    if (!password) {
      setStatus("denied");
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus(password === "445" ? "allowed" : "denied");
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const client = createSupabaseClient({ "x-admin-password": password });
        if (!client) {
          if (!cancelled) setStatus("denied");
          return;
        }
        const { data, error } = await client.rpc("check_admin_password");
        if (cancelled) return;
        if (error || data !== true) {
          clearAdminPassword();
          setStatus("denied");
          return;
        }
        setStatus("allowed");
      } catch {
        if (cancelled) return;
        clearAdminPassword();
        setStatus("denied");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [password]);

  if (status === "allowed") return children;
  if (status === "denied") return <Navigate to={`/acesso?next=${next}`} replace />;
  return <div className="text-sm text-slate-300">Validando acesso…</div>;
}
