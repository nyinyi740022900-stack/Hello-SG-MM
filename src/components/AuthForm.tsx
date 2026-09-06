"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import { Button } from "@/components/ui/Button";

type AuthFormValues = {
  email: string;
  password: string;
};

type AuthFormProps = {
  locale: AppLocale;
  mode: "login" | "register";
};

export default function AuthForm({ locale, mode }: AuthFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, isConfigured, resendVerificationEmail } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const authSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("errorInvalidEmail")),
        password: z.string().min(6, t("errorPasswordLength")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setVerificationNotice(null);

    const nextPath = searchParams.get("next");
    const safeNextPath =
      nextPath && nextPath.startsWith(`/${locale}`) ? nextPath : `/${locale}/passport/wizard`;

    if (mode === "login") {
      const errorMessage = await signIn(values.email, values.password);
      if (errorMessage) {
        setSubmitError(errorMessage);
        return;
      }
      router.replace(safeNextPath, { locale });
      return;
    }

    const signUpResult = await signUp(values.email, values.password, `/${locale}/login`);
    if (signUpResult.error) {
      setSubmitError(signUpResult.error);
      return;
    }

    if (signUpResult.needsEmailConfirmation) {
      setVerificationNotice(t("verifyEmailNotice"));
      return;
    }

    router.replace(safeNextPath, { locale });
  };

  const handleResendVerification = async () => {
    const email = getValues("email").trim();
    if (!email) {
      setSubmitError(t("errorEmailFirst"));
      return;
    }

    setIsResendingVerification(true);
    setSubmitError(null);
    const errorMessage = await resendVerificationEmail(email, `/${locale}/login`);
    setIsResendingVerification(false);

    if (errorMessage) {
      setSubmitError(errorMessage);
      return;
    }

    setSubmitSuccess(t("verificationResent"));
  };

  // ── Not configured ──────────────────────────────────────────────────────
  if (!isConfigured) {
    return (
      <StatusMessage variant="error">
        {t("errorNotConfigured")}
        <span className="mt-0.5 block text-xs opacity-80">
          {t("errorNotConfiguredHint")}{" "}
          <code className="rounded bg-danger-soft px-0.5 font-mono">.env.local</code>
        </span>
      </StatusMessage>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {/* Email */}
      <FormField label={t("fieldEmail")} error={errors.email?.message}>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-describedby={errors.email ? "auth-email-error" : undefined}
          className={INPUT_CLASS}
          {...register("email")}
        />
      </FormField>

      {/* Password */}
      <FormField
        label={t("fieldPassword")}
        error={errors.password?.message}
        hint={mode === "register" ? t("passwordHint") : undefined}
      >
        <div className="relative">
          <input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "register" ? t("passwordPlaceholderNew") : t("passwordPlaceholderExisting")}
            className={`${INPUT_CLASS} pr-20`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-xs font-semibold text-ink-muted transition hover:bg-surface-muted hover:text-ink"
          >
            {showPassword ? t("hidePassword") : t("showPassword")}
          </button>
        </div>
      </FormField>

      {/* Server-level error */}
      {submitError ? (
        <StatusMessage variant="error">{submitError}</StatusMessage>
      ) : null}
      {verificationNotice ? (
        <StatusMessage variant="warning">{verificationNotice}</StatusMessage>
      ) : null}
      {submitSuccess ? (
        <StatusMessage variant="success">{submitSuccess}</StatusMessage>
      ) : null}

      {mode === "login" && submitError?.toLowerCase().includes("email not confirmed") ? (
        <button
          type="button"
          disabled={isResendingVerification}
          onClick={() => void handleResendVerification()}
          className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs font-medium text-ink-muted transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResendingVerification ? t("resending") : t("resendVerification")}
        </button>
      ) : null}

      {mode === "login" ? (
        <p className="text-xs text-ink-subtle">
          <Link href="/forgot-password" locale={locale} className="underline hover:text-ink">
            {t("forgotPassword")}
          </Link>
        </p>
      ) : null}

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span aria-hidden="true" className="inline-block animate-spin">⟳</span>
            {t("submitting")}
          </span>
        ) : mode === "login" ? (
          t("submitLogin")
        ) : (
          t("submitRegister")
        )}
      </Button>
    </form>
  );
}
