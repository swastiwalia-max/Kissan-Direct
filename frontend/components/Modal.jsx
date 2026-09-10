import { X } from "lucide-react";
import { useEffect } from "react";
import Button from "./Button";

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="kd-modal-overlay" onClick={onClose}>
      <div
        className="kd-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kd-modal__close">
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </Button>
        </div>
        {title && <h3 className="kd-heading kd-mt-sm">{title}</h3>}
        <div className="kd-mt-md">{children}</div>
        {footer && (
          <div className="kd-flex kd-flex--gap-sm kd-mt-lg" style={{ justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
