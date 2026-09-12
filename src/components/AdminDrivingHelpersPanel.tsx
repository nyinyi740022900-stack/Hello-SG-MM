"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import { helperImageUrl, type DrivingHelperRow } from "@/lib/drivingHelpers";

type AdminDrivingHelpersPanelProps = {
  initialHelpers: DrivingHelperRow[];
};

type FormState = {
  id?: string;
  nameEn: string;
  nameMy: string;
  descriptionEn: string;
  descriptionMy: string;
  imagePath: string;
  facebookUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
  groupUrl: string;
  websiteUrl: string;
  isFree: boolean;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  nameEn: "",
  nameMy: "",
  descriptionEn: "",
  descriptionMy: "",
  imagePath: "",
  facebookUrl: "",
  telegramUrl: "",
  whatsappUrl: "",
  groupUrl: "",
  websiteUrl: "",
  isFree: true,
  isActive: true,
  sortOrder: 0,
};

export default function AdminDrivingHelpersPanel({
  initialHelpers,
}: AdminDrivingHelpersPanelProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [helpers, setHelpers] = useState(initialHelpers);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const editing = Boolean(form.id);
  const previewUrl = helperImageUrl(form.imagePath || null);

  const sorted = useMemo(
    () =>
      [...helpers].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.name_en.localeCompare(b.name_en);
      }),
    [helpers],
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setError(null);
    setMessage(null);
  }

  function startEdit(row: DrivingHelperRow) {
    setForm({
      id: row.id,
      nameEn: row.name_en,
      nameMy: row.name_my,
      descriptionEn: row.description_en ?? "",
      descriptionMy: row.description_my ?? "",
      imagePath: row.image_path ?? "",
      facebookUrl: row.facebook_url ?? "",
      telegramUrl: row.telegram_url ?? "",
      whatsappUrl: row.whatsapp_url ?? "",
      groupUrl: row.group_url ?? "",
      websiteUrl: row.website_url ?? "",
      isFree: row.is_free,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    });
    setError(null);
    setMessage(null);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/driving-helpers/upload", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !payload.path) {
        setError(payload.error ?? "Upload failed.");
        return;
      }
      setForm((prev) => ({ ...prev, imagePath: payload.path! }));
      setMessage("Image uploaded.");
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/driving-helpers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.id,
            nameEn: form.nameEn,
            nameMy: form.nameMy,
            descriptionEn: form.descriptionEn || null,
            descriptionMy: form.descriptionMy || null,
            imagePath: form.imagePath || null,
            facebookUrl: form.facebookUrl || null,
            telegramUrl: form.telegramUrl || null,
            whatsappUrl: form.whatsappUrl || null,
            groupUrl: form.groupUrl || null,
            websiteUrl: form.websiteUrl || null,
            isFree: form.isFree,
            isActive: form.isActive,
            sortOrder: form.sortOrder,
          }),
        });
        const payload = (await response.json()) as {
          helper?: DrivingHelperRow;
          error?: string;
        };
        if (!response.ok || !payload.helper) {
          setError(payload.error ?? "Could not save.");
          return;
        }
        const saved = payload.helper;
        setHelpers((prev) => {
          const without = prev.filter((h) => h.id !== saved.id);
          return [...without, saved];
        });
        setMessage(editing ? "Helper updated." : "Helper created.");
        setForm(EMPTY_FORM);
        router.refresh();
      } catch {
        setError("Could not save.");
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this helper?")) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/driving-helpers?id=${id}`, {
          method: "DELETE",
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(payload.error ?? "Could not delete.");
          return;
        }
        setHelpers((prev) => prev.filter((h) => h.id !== id));
        if (form.id === id) resetForm();
        setMessage("Helper deleted.");
        router.refresh();
      } catch {
        setError("Could not delete.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h3 className="font-semibold text-ink">
          {editing ? "Edit helper" : "Add helper"}
        </h3>
        <p className="text-sm text-ink-muted">
          Free Myanmar-language driving help (not official). Add EN + MY name,
          optional photo, and at least one https link.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name (English)">
            <input
              id="helper-name-en"
              className={INPUT_CLASS}
              value={form.nameEn}
              onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
            />
          </FormField>
          <FormField label="Name (Myanmar)">
            <input
              id="helper-name-my"
              className={INPUT_CLASS}
              value={form.nameMy}
              onChange={(e) => setForm((p) => ({ ...p, nameMy: e.target.value }))}
            />
          </FormField>
        </div>

        <FormField label="Description (English)">
          <textarea
            id="helper-desc-en"
            className={INPUT_CLASS}
            rows={2}
            value={form.descriptionEn}
            onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
          />
        </FormField>
        <FormField label="Description (Myanmar)">
          <textarea
            id="helper-desc-my"
            className={INPUT_CLASS}
            rows={2}
            value={form.descriptionMy}
            onChange={(e) => setForm((p) => ({ ...p, descriptionMy: e.target.value }))}
          />
        </FormField>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Photo (optional)</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm text-ink-muted"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadImage(file);
            }}
          />
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-32 w-full max-w-xs rounded-xl object-cover"
            />
          ) : null}
          {form.imagePath ? (
            <button
              type="button"
              className="text-sm text-danger underline"
              onClick={() => setForm((p) => ({ ...p, imagePath: "" }))}
            >
              Remove image
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Facebook URL">
            <input
              id="helper-fb"
              className={INPUT_CLASS}
              placeholder="https://facebook.com/..."
              value={form.facebookUrl}
              onChange={(e) => setForm((p) => ({ ...p, facebookUrl: e.target.value }))}
            />
          </FormField>
          <FormField label="Telegram URL">
            <input
              id="helper-tg"
              className={INPUT_CLASS}
              placeholder="https://t.me/..."
              value={form.telegramUrl}
              onChange={(e) => setForm((p) => ({ ...p, telegramUrl: e.target.value }))}
            />
          </FormField>
          <FormField label="WhatsApp URL">
            <input
              id="helper-wa"
              className={INPUT_CLASS}
              placeholder="https://wa.me/65..."
              value={form.whatsappUrl}
              onChange={(e) => setForm((p) => ({ ...p, whatsappUrl: e.target.value }))}
            />
          </FormField>
          <FormField label="Group link">
            <input
              id="helper-group"
              className={INPUT_CLASS}
              placeholder="https://..."
              value={form.groupUrl}
              onChange={(e) => setForm((p) => ({ ...p, groupUrl: e.target.value }))}
            />
          </FormField>
          <FormField label="Website">
            <input
              id="helper-web"
              className={INPUT_CLASS}
              placeholder="https://..."
              value={form.websiteUrl}
              onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
            />
          </FormField>
          <FormField label="Sort order">
            <input
              id="helper-sort"
              type="number"
              min={0}
              className={INPUT_CLASS}
              value={form.sortOrder}
              onChange={(e) =>
                setForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))
              }
            />
          </FormField>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-ink">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => setForm((p) => ({ ...p, isFree: e.target.checked }))}
            />
            Mark as free help
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active (show on site)
          </label>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-success">{message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending || uploading}>
            {pending ? "Saving…" : editing ? "Update" : "Create"}
          </Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={resetForm} disabled={pending}>
              Cancel
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold text-ink">Current helpers ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-muted">No helpers yet.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted p-3 sm:flex-row sm:items-center"
              >
                {helperImageUrl(row.image_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={helperImageUrl(row.image_path)!}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs text-brand-strong">
                    No photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    {row.name_en}{" "}
                    <span className="text-ink-muted">/ {row.name_my}</span>
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {row.is_active ? "Active" : "Hidden"}
                    {row.is_free ? " · Free" : ""} · sort {row.sort_order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => startEdit(row)}>
                    Edit
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => remove(row.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
