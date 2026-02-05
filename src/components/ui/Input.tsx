import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      {...props}
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20",
        className,
      )}
    />
  );
});

export default Input;
