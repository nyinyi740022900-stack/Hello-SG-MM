"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import type { AppLocale } from "@/i18n/routing";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import { Button } from "@/components/ui/Button";

type ForgotValues = { email: string };

type ForgotPasswordFormProps = {
  locale: AppLocale;
};

export default function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations("auth");
  const { requestPasswordReset, isConfigured } = useAuth();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const forgotSchema = useMemo(
    () => z.object({ email: z.string().email(t("errorInvalidEmail")) }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotValues) => {
    setResult(null);
    const error = await requestPasswordReset(values.email, `/${locale}/reset-password`);
    if (error) {
      setResult({ ok: false, message: error });
      return;
    }
    setResult({ ok: true, message: t("forgotSent") });
  };

  if (!isConfigured) {
    return (
      <StatusMessage variant="error">{t("errorNotConfigured")}</StatusMessage>
    );
  }

  return (
    <form className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <FormField label={t("fieldEmail")} error={errors.email?.message}>
        <input
          type="email"
          className={INPUT_CLASS}
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("forgotSending") : t("forgotSubmit")}
      </Button>

      {result ? (
        <StatusMessage variant={result.ok ? "success" : "error"}>
          {result.message}
        </StatusMessage>
      ) : null}
    </form>
  );
}
