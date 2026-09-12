"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import {
  AD_PLACEMENT_LABELS,
  AD_PLACEMENTS,
  adImageUrl,
  type AdPlacement,
  type SponsoredAdRow,
} from "@/lib/sponsoredAds";

type AdminAdsPanelProps = {
  initialAds: SponsoredAdRow[];
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  sponsorName: string;
  ctaLabel: string;
  targetUrl: string;
  imagePath: string;
  placement: AdPlacement;
  isActive: boolean;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  sponsorName: "",
  ctaLabel: "Learn More",
  targetUrl: "",
  imagePath: "",
  placement: "home_bottom",
  isActive: true,
  sortOrder: 0,
  startsAt: "",
  endsAt: "",
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

export default function AdminAdsPanel({ initialAds }: AdminAdsPanelProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [ads, setAds] = useState(initialAds);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const editing = Boolean(form.id);
  const previewUrl = adImageUrl(form.imagePath || null);

  const sorted = useMemo(
    () =>
      [...ads].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.title.localeCompare(b.title);
      }),
    [ads],
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setError(null);
    setMessage(null);
  }

  function startEdit(ad: SponsoredAdRow) {
    setForm({
      id: ad.id,
      title: ad.title,
      description: ad.description ?? "",
      sponsorName: ad.sponsor_name,
      ctaLabel: ad.cta_label,
      targetUrl: ad.target_url,
      imagePath: ad.image_path ?? "",
      placement: ad.placement,
      isActive: ad.is_active,
      sortOrder: ad.sort_order,
      startsAt: toDatetimeLocal(ad.starts_at),
      endsAt: toDatetimeLocal(ad.ends_at),
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
      const response = await fetch("/api/admin/ads/upload", {
        method: "POST",
        body,
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Upload failed.";
        setError(msg);
        return;
      }
      const path =
        typeof payload === "object" &&
        payload !== null &&
        "path" in payload &&
        typeof (payload as { path: unknown }).path === "string"
          ? (payload as { path: string }).path
          : null;
      if (!path) {
        setError("Upload failed.");
        return;
      }
      setForm((prev) => ({ ...prev, imagePath: path }));
      setMessage("Image uploaded. Save the ad to apply.");
    } catch {
      setError("Network error while uploading.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.id,
            title: form.title,
            description: form.description || null,
            sponsorName: form.sponsorName || "Partner",
            ctaLabel: form.ctaLabel || "Learn More",
            targetUrl: form.targetUrl,
            imagePath: form.imagePath || null,
            placement: form.placement,
            isActive: form.isActive,
            sortOrder: form.sortOrder,
            startsAt: fromDatetimeLocal(form.startsAt),
            endsAt: fromDatetimeLocal(form.endsAt),
          }),
        });
        const payload: unknown = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error: unknown }).error === "string"
              ? (payload as { error: string }).error
              : "Save failed.";
          setError(msg);
          return;
        }
        const ad =
          typeof payload === "object" && payload !== null && "ad" in payload
            ? (payload as { ad: SponsoredAdRow }).ad
            : null;
        if (ad) {
          setAds((prev) => {
            const without = prev.filter((row) => row.id !== ad.id);
            return [...without, ad];
          });
        }
        setMessage(editing ? "Ad updated." : "Ad created.");
        resetForm();
        router.refresh();
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  function deactivate(id: string) {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Could not deactivate.");
        return;
      }
      setAds((prev) =>
        prev.map((row) => (row.id === id ? { ...row, is_active: false } : row)),
      );
      setMessage("Ad deactivated.");
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Permanently delete this ad?")) return;
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/admin/ads?id=${id}&hard=1`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("Could not delete.");
        return;
      }
      setAds((prev) => prev.filter((row) => row.id !== id));
      setMessage("Ad deleted.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-ink">
            {editing ? "Edit sponsored ad" : "Add sponsored ad"}
          </h3>
          {editing ? (
            <Button variant="secondary" onClick={resetForm} disabled={pending}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <p className="text-sm text-ink-muted">
          Fill in title, details, image, link and placement. Active ads appear on
          the public site for that placement (replacing the default sponsor
          banner).
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Title / headline">
            <input
              className={INPUT_CLASS}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Send money home fast"
              maxLength={120}
            />
          </FormField>
          <FormField label="Sponsor name">
            <input
              className={INPUT_CLASS}
              value={form.sponsorName}
              onChange={(e) =>
                setForm((p) => ({ ...p, sponsorName: e.target.value }))
              }
              placeholder="ABC Remittance"
              maxLength={120}
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Details / description">
              <textarea
                className={INPUT_CLASS}
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Low fees, quick transfers. Mention what the reader gets."
                maxLength={1000}
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField label="Link (https://… or /in-app-path)">
              <input
                className={INPUT_CLASS}
                value={form.targetUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, targetUrl: e.target.value }))
                }
                placeholder="https://partner.example.com or /contact"
              />
            </FormField>
          </div>

          <FormField label="CTA button label">
            <input
              className={INPUT_CLASS}
              value={form.ctaLabel}
              onChange={(e) => setForm((p) => ({ ...p, ctaLabel: e.target.value }))}
              placeholder="Learn More"
              maxLength={60}
            />
          </FormField>

          <FormField label="Placement">
            <select
              className={INPUT_CLASS}
              value={form.placement}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  placement: e.target.value as AdPlacement,
                }))
              }
            >
              {AD_PLACEMENTS.map((placement) => (
                <option key={placement} value={placement}>
                  {AD_PLACEMENT_LABELS[placement]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Sort order (lower = first)">
            <input
              type="number"
              className={INPUT_CLASS}
              value={form.sortOrder}
              min={0}
              max={999}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  sortOrder: Number(e.target.value) || 0,
                }))
              }
            />
          </FormField>

          <FormField label="Active">
            <label className="mt-2 flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isActive: e.target.checked }))
                }
              />
              Show on the public site
            </label>
          </FormField>

          <FormField label="Starts at (optional)">
            <input
              type="datetime-local"
              className={INPUT_CLASS}
              value={form.startsAt}
              onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
            />
          </FormField>
          <FormField label="Ends at (optional)">
            <input
              type="datetime-local"
              className={INPUT_CLASS}
              value={form.endsAt}
              onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
            />
          </FormField>

          <div className="sm:col-span-2 space-y-2">
            <FormField label="Board image (optional)">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void uploadImage(file);
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={uploading || pending}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? "Uploading…" : "Upload image"}
                </Button>
                {form.imagePath ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => setForm((p) => ({ ...p, imagePath: "" }))}
                  >
                    Remove image
                  </Button>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-ink-subtle">
                JPG / PNG / WebP / GIF — max 3 MB. Recommended wide banner ~1200×400.
              </p>
            </FormField>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="mt-2 max-h-40 w-full rounded-xl border border-border object-cover"
              />
            ) : null}
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-success">{message}</p> : null}

        <Button onClick={submit} disabled={pending || uploading}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create ad"}
        </Button>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold text-ink">Ads board ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-subtle">No ads yet. Add one above.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((ad) => {
              const image = adImageUrl(ad.image_path);
              return (
                <li
                  key={ad.id}
                  className="rounded-xl border border-border bg-surface-muted p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        className="h-24 w-full shrink-0 rounded-lg object-cover sm:w-40"
                      />
                    ) : (
                      <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-xs text-ink-subtle sm:w-40">
                        No image
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{ad.title}</p>
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            ad.is_active
                              ? "bg-success-soft text-success"
                              : "bg-surface text-ink-subtle",
                          ].join(" ")}
                        >
                          {ad.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        {AD_PLACEMENT_LABELS[ad.placement]} · {ad.sponsor_name} ·
                        sort {ad.sort_order}
                      </p>
                      {ad.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                          {ad.description}
                        </p>
                      ) : null}
                      <p className="mt-1 truncate text-xs text-brand-strong">
                        {ad.target_url}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => startEdit(ad)}
                        >
                          Edit
                        </Button>
                        {ad.is_active ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={pending}
                            onClick={() => deactivate(ad.id)}
                          >
                            Deactivate
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => remove(ad.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
