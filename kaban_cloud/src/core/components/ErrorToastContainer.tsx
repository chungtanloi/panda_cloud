import { AlertTriangle, Info, RotateCw, X } from 'lucide-react';
import { useErrorNotification } from '../hooks/useErrorNotification';

export interface ErrorToastContainerProps {
  className?: string;
}

/**
 * Fixed-position stack of error toasts driven by useErrorNotification.
 * Mounted once by <Kanban /> (or drop it anywhere in your own tree — it's
 * a singleton store, so multiple mounts stay in sync). Each toast
 * auto-clears after 5s and shows a Retry button when the failed action
 * supplied one.
 */
export function ErrorToastContainer({ className }: ErrorToastContainerProps) {
  const { toasts, dismiss, retry } = useErrorNotification();

  if (toasts.length === 0) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 ${className ?? ''}`}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-800 ${
            toast.type === 'error' ? 'border-red-200 dark:border-red-900' : 'border-blue-200 dark:border-blue-900'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
          ) : (
            <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
          )}
          <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">{toast.message}</p>
          <div className="flex shrink-0 items-center gap-1">
            {toast.retry && (
              <button
                type="button"
                onClick={() => retry(toast.id)}
                className="flex items-center gap-1 rounded-md border border-kanban-border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <RotateCw size={12} />
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
