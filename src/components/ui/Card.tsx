import type { ElementType, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  as?: ElementType;
};

const PADDING = {
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6 sm:p-8",
};

export function Card({ children, className = "", padding = "md", as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-border bg-surface ${PADDING[padding]} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="inline-flex rounded-full border border-brand-soft-border bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {subtitle ? <p className="max-w-2xl text-ink-muted">{subtitle}</p> : null}
    </div>
  );
}
