"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  approveContentItem,
  createManualContentItem,
  deleteContentItem,
  listPendingContent,
  rejectContentItem,
  type ContentCategory,
  type ContentItem,
} from "@/lib/content";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  mom_policy: "MOM Policy",
  embassy: "Embassy",
  safety_scam: "Safety / Scam Alert",
  finance: "Money",
  legal: "Rights",
  health: "Health",
  community: "Community",
  education: "Training",
  transport: "Transport",
  jobs: "Jobs",
};

const manualSchema = z.object({
  category: z.enum([
    "mom_policy",
    "embassy",
    "safety_scam",
    "finance",
    "legal",
    "health",
    "community",
    "education",
  ]),
  titleEn: z.string().min(4, "Title (English) is required."),
  titleMy: z.string().min(4, "Title (Myanmar) is required."),
  bodyEn: z.string().min(10, "Body (English) is required."),
  bodyMy: z.string().min(10, "Body (Myanmar) is required."),
  sourceUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
});

type ManualFormValues = z.infer<typeof manualSchema>;

export default function NewsReviewPanel() {
  const [pending, setPending] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      category: "mom_policy",
      titleEn: "",
      titleMy: "",
      bodyEn: "",
      bodyMy: "",
      sourceUrl: "",
    },
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await listPendingContent();
    if (error) setLoadError(error);
    else setPending(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const handleApprove = async (id: string) => {
    setActionError(null);
    const { error } = await approveContentItem(id);
    if (error) {
      setActionError(error);
      return;
    }
    void refresh();
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const { error } = await rejectContentItem(id);
    if (error) {
      setActionError(error);
      return;
    }
    void refresh();
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    const { error } = await deleteContentItem(id);
    if (error) {
      setActionError(error);
      return;
    }
    void refresh();
  };

  const onSubmitManual = async (values: ManualFormValues) => {
    setManualSuccess(false);
    const { error } = await createManualContentItem({
      category: values.category,
      titleEn: values.titleEn,
      titleMy: values.titleMy,
      bodyEn: values.bodyEn,
      bodyMy: values.bodyMy,
      sourceUrl: values.sourceUrl || undefined,
    });
    if (error) {
      setActionError(error);
      return;
    }
    reset();
    setManualSuccess(true);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h3 className="font-semibold text-ink">Post a manual update</h3>
        <form onSubmit={handleSubmit(onSubmitManual)} className="space-y-3">
          <FormField label="Category">
            <select className={INPUT_CLASS} {...register("category")}>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Title (English)" error={errors.titleEn?.message}>
              <input className={INPUT_CLASS} {...register("titleEn")} />
            </FormField>
            <FormField label="Title (Myanmar)" error={errors.titleMy?.message}>
              <input className={INPUT_CLASS} {...register("titleMy")} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Body (English)" error={errors.bodyEn?.message}>
              <textarea rows={3} className={INPUT_CLASS} {...register("bodyEn")} />
            </FormField>
            <FormField label="Body (Myanmar)" error={errors.bodyMy?.message}>
              <textarea rows={3} className={INPUT_CLASS} {...register("bodyMy")} />
            </FormField>
          </div>
          <FormField label="Source URL (optional)" error={errors.sourceUrl?.message}>
            <input className={INPUT_CLASS} placeholder="https://..." {...register("sourceUrl")} />
          </FormField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Publishing…" : "Publish now"}
          </Button>
          {manualSuccess ? <StatusMessage variant="success">Published.</StatusMessage> : null}
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-ink">Pending agent submissions ({pending.length})</h3>
        {actionError ? <StatusMessage variant="error">{actionError}</StatusMessage> : null}
        {isLoading ? (
          <StatusMessage variant="loading">Loading pending items…</StatusMessage>
        ) : loadError ? (
          <StatusMessage variant="error">{loadError}</StatusMessage>
        ) : pending.length === 0 ? (
          <StatusMessage variant="info">No pending items — the daily agent hasn&apos;t submitted anything new, or everything has been reviewed.</StatusMessage>
        ) : (
          pending.map((item) => (
            <Card key={item.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong">
                  {CATEGORY_LABELS[item.category]}
                </span>
                <span className="text-xs text-ink-subtle">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              <p className="font-semibold text-ink">{item.title_en}</p>
              <p className="text-sm text-ink-muted">{item.body_en}</p>
              <p className="font-semibold text-ink">{item.title_my}</p>
              <p className="text-sm text-ink-muted">{item.body_my}</p>
              {item.source_url ? (
                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-strong underline">
                  {item.source_url}
                </a>
              ) : null}
              <div className="flex gap-2 pt-1">
                <Button size="md" className="h-9 px-4 text-xs" onClick={() => void handleApprove(item.id)}>
                  Approve & Publish
                </Button>
                <Button variant="secondary" size="md" className="h-9 px-4 text-xs" onClick={() => void handleReject(item.id)}>
                  Reject
                </Button>
                <Button variant="danger" size="md" className="h-9 px-4 text-xs" onClick={() => void handleDelete(item.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
