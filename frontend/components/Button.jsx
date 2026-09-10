import { Loader2 } from "lucide-react";

/**
 * Reusable button. variant: primary | secondary | mustard | ghost | danger
 */
export default function Button({
  children,
  variant = "primary",
  size,
  full,
  loading,
  icon: Icon,
  type = "button",
  className = "",
  ...rest
}) {
  const classes = [
    "kd-btn",
    `kd-btn--${variant}`,
    size === "sm" ? "kd-btn--sm" : "",
    full ? "kd-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={loading || rest.disabled} {...rest}>
      {loading ? <Loader2 size={16} className="kd-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}
