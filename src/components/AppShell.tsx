import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Factory, PackageOpen, ShoppingBasket } from "lucide-react";

function TopLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
          isActive
            ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
            : "text-slate-200 hover:bg-white/5",
        ].join(" ")
      }
    >
      <span className="text-slate-200/90">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0B1220]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <PackageOpen className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-100">Automatizador de Pedidos</div>
              <div className="text-xs text-slate-400">Loja ↔ Fábrica</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <TopLink to="/produtos" label="Produtos" icon={<PackageOpen className="h-4 w-4" />} />
            <TopLink to="/loja" label="Loja" icon={<ShoppingBasket className="h-4 w-4" />} />
            <TopLink to="/fabrica" label="Fábrica" icon={<Factory className="h-4 w-4" />} />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-6">{children}</main>
    </div>
  );
}
