import type { ComponentPropsWithoutRef } from "react";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-brand text-ink-on-brand hover:bg-brand-strong shadow-sm",
  secondary:
    "border border-border-strong bg-surface text-ink hover:border-brand hover:text-brand",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "h-11 px-4 text-sm",
  lg: "h-13 px-6 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...props}
    />
  );
}

type LinkButtonProps = {
  href: Parameters<typeof Link>[0]["href"];
  locale?: AppLocale;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function LinkButton({
  href,
  locale,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      locale={locale}
      className={`${BASE} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
