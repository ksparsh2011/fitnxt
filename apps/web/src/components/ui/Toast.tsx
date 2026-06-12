"use client";
import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastCtx {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = crypto.randomUUID();
    setItems(prev => [...prev, { id, message, variant }]);
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: string) => setItems(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full"
      >
        {items.map(item => (
          <ToastItem key={item.id} {...item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const variantConfig: Record<ToastVariant, { icon: LucideIcon; color: string }> = {
  success: { icon: CheckCircle2, color: "text-[var(--success)]" },
  error:   { icon: AlertCircle,  color: "text-[var(--danger)]"  },
  info:    { icon: Info,         color: "text-violet"           },
  warning: { icon: AlertCircle,  color: "text-gold"             },
};

function ToastItem({
  id, message, variant, onDismiss,
}: ToastItem & { onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const { icon: Icon, color } = variantConfig[variant];

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2.5 p-3.5 rounded-2xl",
        "bg-[var(--surface-2)] border border-[var(--border-2)]",
        "shadow-lg backdrop-blur transition-all duration-200",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", color)} strokeWidth={1.8} aria-hidden="true" />
      <p className="text-sm text-t1 flex-1">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="text-t2 hover:text-t1 transition-colors"
      >
        <X className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
