"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  approveContentItems,
  createManualContentItem,
  deleteContentItem,
  listPendingContent,
  rejectContentItem,
  updateContentItem,
  CONTENT_CATEGORIES,
  type ContentCategory,
  type ContentEditableFields,
  type ContentItem,
  type ContentPriority,
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

const PRIORITY_LABELS: Record<ContentPriority, string> = {
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_BADGE_CLASS: Record<ContentPriority, string> = {
  normal: "bg-surface-muted text-ink-muted",
  high: "bg-warning-soft text-warning",
  urgent: "bg-danger-soft text-danger",
};

const manualSchema = z.object({
  category: z.enum(CONTENT_CATEGORIES as [ContentCategory, ...ContentCategory[]]),
  titleEn: z.string().min(4, "Title (English) is required."),
  titleMy: z.string().min(4, "Title (Myanmar) is required."),
  bodyEn: z.string().min(10, "Body (English) is required."),
  bodyMy: z.string().min(10, "Body (Myanmar) is required."),
  sourceUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
});

type ManualFormValues = z.infer<typeof manualSchema>;

type EditState = ContentEditableFields;

function toEditState(item: ContentItem): EditState {
  return {
    title_en: item.title_en,
    title_my: item.title_my,
    summary_en: item.summary_en,
    summary_my: item.summary_my,
    body_en: item.body_en,
    body_my: item.body_my,
    category: item.category,
    priority: item.priority,
  };
}

/** Only the fields that actually differ from the original item. */
function diffEditState(
  original: ContentItem,
  edited: EditState,
): Partial<ContentEditableFields> {
  const patch: Partial<ContentEditableFields> = {};
  (Object.keys(edited) as (keyof ContentEditableFields)[]).forEach((key) => {
    if (edited[key] !== original[key]) {
      // Each field on ContentEditableFields is independently assignable from
      // the matching field on EditState (they share the same type), but
      // TypeScript can't verify that across a generic key without this cast.
      (patch as Record<string, unknown>)[key] = edited[key];
    }
  });
  return patch;
}

export default function ContentReviewPanel() {
  const [pending, setPending] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isApproving, setIsApproving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

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
    if (error) {
      setLoadError(error);
    } else {
      const items = data ?? [];
      setPending(items);
      // Drop selections for items that are no longer pending (approved/rejected/deleted).
      const validIds = new Set(items.map((item) => item.id));
      setSelectedIds((prev) => {
        const next = new Set([...prev].filter((id) => validIds.has(id)));
        return next.size === prev.size ? prev : next;
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const allSelected = pending.length > 0 && selectedIds.size === pending.length;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(pending.map((item) => item.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleApproveSelected = async () => {
    if (selectedIds.size === 0) return;
    setActionError(null);
    setIsApproving(true);
    const { error } = await approveContentItems([...selectedIds]);
    setIsApproving(false);
    if (error) {
      setActionError(error);
      return;
    }
    clearSelection();
    void refresh();
  };

  const startEditing = (item: ContentItem) => {
    setEditingId(item.id);
    setEditState(toEditState(item));
    setSavedId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditState(null);
  };

  const updateEditField = <K extends keyof EditState>(key: K, value: EditState[K]) => {
    setEditState((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSaveEdit = async (item: ContentItem) => {
    if (!editState) return;
    const patch = diffEditState(item, editState);
    setActionError(null);
    setIsSaving(true);
    const { error } = await updateContentItem(item.id, patch);
    setIsSaving(false);
    if (error) {
      setActionError(error);
      return;
    }
    setEditingId(null);
    setEditState(null);
    setSavedId(item.id);
    void refresh();
  };

  const startReject = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectReason("");
  };

  const confirmReject = async (id: string) => {
    setActionError(null);
    setIsRejecting(true);
    const { error } = await rejectContentItem(id, rejectReason.trim() || undefined);
    setIsRejecting(false);
    if (error) {
      setActionError(error);
      return;
    }
    setRejectingId(null);
    setRejectReason("");
    void refresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item permanently? This cannot be undone.")) return;
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

  const selectedCount = selectedIds.size;

  const categoryOptions = useMemo(
    () => CONTENT_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
    [],
  );

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h3 className="font-semibold text-ink">Post a manual update</h3>
        <form onSubmit={handleSubmit(onSubmitManual)} className="space-y-3">
          <FormField label="Category">
            <select className={INPUT_CLASS} {...register("category")}>
              {categoryOptions.map(({ value, label }) => (
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
              <input className={INPUT_CLASS} lang="my" {...register("titleMy")} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Body (English)" error={errors.bodyEn?.message}>
              <textarea rows={3} className={INPUT_CLASS} {...register("bodyEn")} />
            </FormField>
            <FormField label="Body (Myanmar)" error={errors.bodyMy?.message}>
              <textarea rows={3} className={INPUT_CLASS} lang="my" {...register("bodyMy")} />
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">Pending agent submissions ({pending.length})</h3>
          {pending.length > 0 ? (
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={allSelected ? clearSelection : selectAll}
                className="font-medium text-brand-strong underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft-border rounded"
              >
                {allSelected ? "Clear selection" : "Select all"}
              </button>
            </div>
          ) : null}
        </div>

        {actionError ? <StatusMessage variant="error">{actionError}</StatusMessage> : null}

        {pending.length > 0 ? (
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
            <span className="text-sm font-medium text-ink">
              {selectedCount} selected
            </span>
            <Button
              size="md"
              className="h-9 px-4 text-xs"
              disabled={selectedCount === 0 || isApproving}
              onClick={() => void handleApproveSelected()}
            >
              {isApproving ? "Approving…" : `Approve selected (${selectedCount})`}
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <StatusMessage variant="loading">Loading pending items…</StatusMessage>
        ) : loadError ? (
          <StatusMessage variant="error">{loadError}</StatusMessage>
        ) : pending.length === 0 ? (
          <StatusMessage variant="info">
            No pending items — the daily agent hasn&apos;t submitted anything new, or everything
            has been reviewed.
          </StatusMessage>
        ) : (
          pending.map((item) => {
            const isEditing = editingId === item.id;
            const isRejectingThis = rejectingId === item.id;
            const isSelected = selectedIds.has(item.id);

            return (
              <Card key={item.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Select "${item.title_en}" for approval`}
                      className="h-4 w-4 rounded border-border-strong accent-brand focus-visible:ring-2 focus-visible:ring-brand-soft-border"
                    />
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_BADGE_CLASS[item.priority]}`}
                    >
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                    <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-xs text-ink-subtle">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                {isEditing && editState ? (
                  <div className="space-y-3 rounded-xl border border-border bg-surface-muted p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField label="Category">
                        <select
                          className={INPUT_CLASS}
                          value={editState.category}
                          onChange={(e) =>
                            updateEditField("category", e.target.value as ContentCategory)
                          }
                        >
                          {categoryOptions.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Priority">
                        <select
                          className={INPUT_CLASS}
                          value={editState.priority}
                          onChange={(e) =>
                            updateEditField("priority", e.target.value as ContentPriority)
                          }
                        >
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </FormField>
                    </div>

                    <FormField label="Title (English)">
                      <input
                        className={INPUT_CLASS}
                        value={editState.title_en}
                        onChange={(e) => updateEditField("title_en", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Title (Myanmar)">
                      <input
                        className={INPUT_CLASS}
                        lang="my"
                        value={editState.title_my}
                        onChange={(e) => updateEditField("title_my", e.target.value)}
                      />
                    </FormField>

                    <FormField label="Summary (English)">
                      <textarea
                        rows={2}
                        className={INPUT_CLASS}
                        value={editState.summary_en ?? ""}
                        onChange={(e) => updateEditField("summary_en", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Summary (Myanmar)">
                      <textarea
                        rows={2}
                        className={INPUT_CLASS}
                        lang="my"
                        value={editState.summary_my ?? ""}
                        onChange={(e) => updateEditField("summary_my", e.target.value)}
                      />
                    </FormField>

                    <FormField label="Body (English)">
                      <textarea
                        rows={4}
                        className={INPUT_CLASS}
                        value={editState.body_en}
                        onChange={(e) => updateEditField("body_en", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Body (Myanmar)">
                      <textarea
                        rows={4}
                        className={INPUT_CLASS}
                        lang="my"
                        value={editState.body_my}
                        onChange={(e) => updateEditField("body_my", e.target.value)}
                      />
                    </FormField>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="md"
                        className="h-9 px-4 text-xs"
                        disabled={isSaving}
                        onClick={() => void handleSaveEdit(item)}
                      >
                        {isSaving ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        className="h-9 px-4 text-xs"
                        disabled={isSaving}
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-ink-subtle">Title (English)</p>
                      <p className="font-semibold text-ink">{item.title_en}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ink-subtle">Title (Myanmar)</p>
                      <p className="font-semibold text-ink" lang="my">
                        {item.title_my}
                      </p>
                    </div>
                    {item.summary_en || item.summary_my ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <p className="text-sm text-ink-muted">{item.summary_en}</p>
                        <p className="text-sm text-ink-muted" lang="my">
                          {item.summary_my}
                        </p>
                      </div>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <p className="text-sm text-ink-muted">{item.body_en}</p>
                      <p className="text-sm text-ink-muted" lang="my">
                        {item.body_my}
                      </p>
                    </div>
                    {item.source_name || item.source_url ? (
                      <p className="text-xs text-ink-subtle">
                        Source: {item.source_name ?? "Unknown"}
                        {item.source_url ? (
                          <>
                            {" "}
                            —{" "}
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-brand-strong underline underline-offset-2"
                            >
                              Verify source
                            </a>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                    {savedId === item.id ? (
                      <StatusMessage variant="success">Saved.</StatusMessage>
                    ) : null}

                    {isRejectingThis ? (
                      <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-3">
                        <FormField label="Reason (optional)">
                          <input
                            className={INPUT_CLASS}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Why is this being rejected?"
                          />
                        </FormField>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="md"
                            className="h-9 px-4 text-xs"
                            disabled={isRejecting}
                            onClick={() => void confirmReject(item.id)}
                          >
                            {isRejecting ? "Rejecting…" : "Confirm reject"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="md"
                            className="h-9 px-4 text-xs"
                            disabled={isRejecting}
                            onClick={cancelReject}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="md"
                          className="h-9 px-4 text-xs"
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          className="h-9 px-4 text-xs"
                          onClick={() => startReject(item.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="danger"
                          size="md"
                          className="h-9 px-4 text-xs"
                          onClick={() => void handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
