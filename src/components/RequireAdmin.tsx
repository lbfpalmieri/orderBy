import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasAdminAccess } from "@/utils/adminAccess";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (hasAdminAccess()) return children;
  const next = encodeURIComponent(`${location.pathname}${location.search}`);
  return <Navigate to={`/acesso?next=${next}`} replace />;
}
