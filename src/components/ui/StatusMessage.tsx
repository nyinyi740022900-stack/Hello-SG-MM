import type { ReactNode } from "react";

/** Supported visual variants for StatusMessage. */
export type StatusVariant = "error" | "warning" | "success" | "info" | "loading";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  error:   "border-danger-border   bg-danger-soft   text-danger",
  warning: "border-warning-border bg-warning-soft  text-warning",
  success: "border-success-border bg-success-soft  text-success",
  info:    "border-border bg-surface-muted  text-ink-muted",
  loading: "border-border bg-surface-muted  text-ink-muted",
};

const VARIANT_ICONS: Record<StatusVariant, string> = {
  error:   "✖",
  warning: "⚠",
  success: "✔",
  info:    "ℹ",
  loading: "…",
};

type StatusMessageProps = {
  variant: StatusVariant;
  children: ReactNode;
  className?: string;
};

/**
 * Reusable status/alert banner.
 *
 * Usage:
 *   <StatusMessage variant="error">Login failed. Try again.</StatusMessage>
 *   <StatusMessage variant="success">Saved!</StatusMessage>
 */
export default function StatusMessage({
  variant,
  children,
  className = "",
}: StatusMessageProps) {
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={[
        "flex items-start gap-2 rounded border px-3 py-2.5 text-sm",
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 select-none font-bold">
        {VARIANT_ICONS[variant]}
      </span>
      <span>{children}</span>
    </div>
  );
}
