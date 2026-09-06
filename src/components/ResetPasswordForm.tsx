"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import { Button } from "@/components/ui/Button";

type ResetValues = { password: string; confirmPassword: string };

type ResetPasswordFormProps = {
  locale: AppLocale;
};

export default function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const { updatePassword, isConfigured } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const resetSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(6, t("errorPasswordLength")),
          confirmPassword: z.string().min(6, t("errorConfirmRequired")),
        })
        .refine((value) => value.password === value.confirmPassword, {
          message: t("errorPasswordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    setResult(null);
    const error = await updatePassword(values.password);
    if (error) {
      setResult({ ok: false, message: error });
      return;
    }
    setResult({ ok: true, message: t("resetSuccess") });
    setTimeout(() => {
      router.replace("/login", { locale });
    }, 1200);
  };

  if (!isConfigured) {
    return (
      <StatusMessage variant="error">{t("errorNotConfigured")}</StatusMessage>
    );
  }

  return (
    <form className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <FormField label={t("fieldNewPassword")} error={errors.password?.message}>
        <input
          type="password"
          className={INPUT_CLASS}
          autoComplete="new-password"
          {...register("password")}
        />
      </FormField>

      <FormField label={t("fieldConfirmPassword")} error={errors.confirmPassword?.message}>
        <input
          type="password"
          className={INPUT_CLASS}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("resetUpdating") : t("resetSubmit")}
      </Button>

      {result ? (
        <StatusMessage variant={result.ok ? "success" : "error"}>
          {result.message}
        </StatusMessage>
      ) : null}
    </form>
  );
}
