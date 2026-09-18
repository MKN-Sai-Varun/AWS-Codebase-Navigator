import { useEffect } from "react";

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return <div className="toast">{toast.message}</div>;
}