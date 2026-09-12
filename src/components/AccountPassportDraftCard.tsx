"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import {
  EMPTY_PASSPORT_DRAFT,
  deletePassportDraft,
  loadPassportDraft,
  type PassportDraftData,
} from "@/lib/formDrafts";
import { PASSPORT_FORM_DOWNLOAD_PATHS } from "@/lib/passportForms";

const SUMMARY_KEYS: (keyof PassportDraftData)[] = [
  "fullName",
  "finNumber",
  "currentPassportNumber",
  "currentPassportIssuedDate",
  "phoneSingapore",
  "emailSingapore",
  "nrcNumber",
  "employerCompany",
];

function draftHasContent(draft: PassportDraftData): boolean {
  return (Object.keys(EMPTY_PASSPORT_DRAFT) as (keyof PassportDraftData)[]).some(
    (key) => {
      if (key === "workerType") return false;
      return Boolean(String(draft[key] ?? "").trim());
    },
  );
}

/**
 * Shows the logged-in user's passport wizard draft on Account:
 * summary, edit (wizard), delete draft, blank PDF download.
 */
export default function AccountPassportDraftCard() {
  const { user, isLoading } = useAuth();
  const t = useTranslations("account");
  const [draft, setDraft] = useState<PassportDraftData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!user) {
        queueMicrotask(() => {
          setDraft(null);
          setError(null);
        });
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: loadError } = await loadPassportDraft(user.id);
      if (!mounted) return;
      if (loadError) {
        setError(loadError);
        setDraft(null);
      } else {
        setDraft(data);
      }
      setLoading(false);
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [user]);

  const hasContent = useMemo(
    () => (draft ? draftHasContent(draft) : false),
    [draft],
  );

  function handleDelete() {
    if (!user) return;
    if (!window.confirm(t("draftDeleteConfirm"))) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const { error: deleteError } = await deletePassportDraft(user.id);
      if (deleteError) {
        setError(deleteError);
        return;
      }
      setDraft(null);
      setMessage(t("draftDeleted"));
    });
  }

  if (isLoading || !user) {
    return null;
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-semibold text-ink">{t("draftTitle")}</h3>
        <p className="mt-1 text-sm text-ink-muted">{t("draftHint")}</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-subtle">{t("draftLoading")}</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !hasContent || !draft ? (
        <div className="space-y-3">
          {message ? <p className="text-sm text-success">{message}</p> : null}
          <p className="text-sm text-ink-muted">{t("draftEmpty")}</p>
          <LinkButton href="/passport/wizard">{t("draftStart")}</LinkButton>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink">
            <span className="font-medium">{t("draftWorkerType")}: </span>
            {draft.workerType === "maid"
              ? t("draftWorkerMaid")
              : t("draftWorkerGeneral")}
          </p>

          <dl className="grid gap-2 rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-2">
            {SUMMARY_KEYS.map((key) => {
              const value = String(draft[key] ?? "").trim();
              if (!value) return null;
              return (
                <div key={key}>
                  <dt className="text-xs text-ink-subtle">{t(`draftField.${key}`)}</dt>
                  <dd className="text-sm font-medium text-ink">{value}</dd>
                </div>
              );
            })}
          </dl>

          <p className="text-xs text-ink-subtle">{t("draftDownloadNote")}</p>

          <div className="flex flex-wrap gap-3">
            <LinkButton href="/passport/wizard">{t("draftEdit")}</LinkButton>
            <a
              href={PASSPORT_FORM_DOWNLOAD_PATHS[draft.workerType]}
              download
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              {t("draftDownload")}
            </a>
            <LinkButton href="/passport/checklist" variant="secondary">
              {t("draftChecklist")}
            </LinkButton>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? t("draftDeleting") : t("draftDelete")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
