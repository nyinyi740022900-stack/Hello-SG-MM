"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";

/**
 * Danger zone: permanently delete the logged-in user account.
 * Requires typing DELETE. Admin accounts are blocked server-side.
 */
export default function AccountDeleteCard() {
  const { user, isLoading, signOut } = useAuth();
  const t = useTranslations("account");
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (isLoading || !user) {
    return null;
  }

  function handleDelete() {
    if (confirmText.trim() !== "DELETE") {
      setError(t("deleteAccountConfirmHint"));
      return;
    }
    if (!window.confirm(t("deleteAccountConfirm"))) return;

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/account/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: "DELETE" }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(payload.error ?? t("deleteAccountFailed"));
          return;
        }
        await signOut();
        router.replace("/");
        router.refresh();
      } catch {
        setError(t("deleteAccountFailed"));
      }
    });
  }

  return (
    <Card className="space-y-4 border-danger-border bg-danger-soft/30">
      <div>
        <h3 className="font-semibold text-danger">{t("deleteAccountTitle")}</h3>
        <p className="mt-1 text-sm text-ink-muted">{t("deleteAccountHint")}</p>
      </div>

      <FormField label={t("deleteAccountTypeLabel")} hint={t("deleteAccountConfirmHint")}>
        <input
          className={INPUT_CLASS}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          disabled={pending}
        />
      </FormField>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button
        type="button"
        variant="danger"
        onClick={handleDelete}
        disabled={pending || confirmText.trim() !== "DELETE"}
      >
        {pending ? t("deleteAccountDeleting") : t("deleteAccountButton")}
      </Button>
    </Card>
  );
}
