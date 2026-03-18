import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export default function Modal({ open, title, description, onClose, children, footer, className }: Props) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onMouseDown={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B1220] shadow-2xl",
            className,
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(title || description) && (
            <div className="border-b border-white/10 px-5 py-4">
              {title && (
                <div id={titleId} className="text-base font-semibold text-slate-100">
                  {title}
                </div>
              )}
              {description && (
                <div id={descriptionId} className="mt-1 text-sm text-slate-400">
                  {description}
                </div>
              )}
            </div>
          )}

          <div className="px-5 py-4">{children}</div>

          {footer && <div className="border-t border-white/10 px-5 py-4">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

