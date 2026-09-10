import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function Alert({ type = "info", children }) {
  const Icon = ICONS[type] || Info;
  return (
    <div className={`kd-alert kd-alert--${type}`} role="status">
      <Icon size={18} />
      <span>{children}</span>
    </div>
  );
}

/**
 * Fixed-position toast stack. Pass an array of { id, type, message }.
 */
export function ToastStack({ toasts = [] }) {
  if (!toasts.length) return null;
  return (
    <div className="kd-toast-stack">
      {toasts.map((t) => (
        <Alert key={t.id} type={t.type}>
          {t.message}
        </Alert>
      ))}
    </div>
  );
}

export default Alert;
