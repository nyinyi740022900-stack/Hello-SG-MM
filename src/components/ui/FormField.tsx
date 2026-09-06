import type { ReactNode } from "react";

type FormFieldProps = {
  /** Label text — bilingual strings or nodes accepted. */
  label: ReactNode;
  /** Validation error message from react-hook-form or manual checks. */
  error?: string;
  /** Supplementary hint shown below the control when there is no error. */
  hint?: ReactNode;
  /** Form control element (input, select, textarea, …). */
  children: ReactNode;
};

/** Shared input class — apply this to every input/select/textarea. */
export const INPUT_CLASS =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-subtle " +
  "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft-border " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle";

/**
 * Wraps a form control with a consistent label, optional hint, and inline
 * validation error. Avoids repetitive `<label><span>…</span>{errors…}</label>`
 * patterns across forms.
 *
 * Usage:
 *   <FormField label="Email / အီးမေးလ်" error={errors.email?.message}>
 *     <input {...register("email")} className={INPUT_CLASS} />
 *   </FormField>
 */
export default function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      {children}
      {!error && hint ? (
        <p className="text-xs text-ink-subtle">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" aria-live="polite" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
