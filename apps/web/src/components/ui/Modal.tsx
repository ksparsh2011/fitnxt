"use client";
import { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => { prev?.focus(); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-desc" : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={cn(
          "relative z-10 w-full max-w-md rounded-3xl animate-slide-up",
          "bg-[var(--surface)] border border-[var(--border)]",
          "p-6 focus:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h2 id="modal-title" className="font-display font-semibold text-lg text-t1">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-desc" className="text-sm text-t2 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-t2 hover:text-t1 transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-[var(--surface-2)]"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
