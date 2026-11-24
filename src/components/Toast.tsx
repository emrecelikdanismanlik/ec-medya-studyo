import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 pointer-events-none safe-bottom">
      {toasts.map((toast) => {
        const Icon =
          toast.kind === 'success'
            ? CheckCircle2
            : toast.kind === 'error'
              ? AlertTriangle
              : Info;

        const accent =
          toast.kind === 'success'
            ? 'border-emerald-400/45 text-emerald-200'
            : toast.kind === 'error'
              ? 'border-rose-400/50 text-rose-200'
              : 'border-[#1D63ED]/50 text-sky-100';

        return (
          <div
            key={toast.id}
            className={`glass-card pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-2xl ${accent}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="flex-1 text-xs sm:text-sm font-medium leading-snug text-[#F5F7FA]">
              {toast.text}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Bildirimi kapat"
              className="rounded-lg p-1 text-[#94A3B8] hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
