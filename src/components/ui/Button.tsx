import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({ className, variant = "secondary", ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
        variant === "secondary" && "bg-white/5 text-slate-100 hover:bg-white/10",
        variant === "danger" && "bg-red-500/15 text-red-200 hover:bg-red-500/25",
        className,
      )}
    />
  );
}

