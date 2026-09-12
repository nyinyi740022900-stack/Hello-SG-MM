"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import { MAX_ROOM_IMAGES, ROOM_LISTING_TTL_DAYS, ROOM_POST_DAILY_LIMIT, ROOM_POST_MONTHLY_LIMIT, ROOM_ACTIVE_CONCURRENT_LIMIT, roomImageUrl } from "@/lib/roomListings";

export default function RoomListingForm() {
  const t = useTranslations("housing");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [priceSgd, setPriceSgd] = useState("");
  const [contact, setContact] = useState("");
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (imagePaths.length >= MAX_ROOM_IMAGES) {
      setError(t("maxPhotos", { count: MAX_ROOM_IMAGES }));
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/room-listings/upload", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !payload.path) {
        setError(payload.error ?? t("uploadFailed"));
        return;
      }
      setImagePaths((prev) => [...prev, payload.path!]);
    } catch {
      setError(t("networkError"));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    const price = Number(priceSgd);
    if (!Number.isFinite(price) || price <= 0) {
      setError(t("invalidPrice"));
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/room-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          area,
          priceSgd: price,
          contact,
          imagePaths,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? t("postFailed"));
        return;
      }
      setSuccess(true);
      setTitle("");
      setDescription("");
      setArea("");
      setPriceSgd("");
      setContact("");
      setImagePaths([]);
      router.refresh();
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <StatusMessage variant="warning">{t("safetyNote")}</StatusMessage>
      <StatusMessage variant="info">
        {t("quotaNote", {
          daily: ROOM_POST_DAILY_LIMIT,
          monthly: ROOM_POST_MONTHLY_LIMIT,
          active: ROOM_ACTIVE_CONCURRENT_LIMIT,
          days: ROOM_LISTING_TTL_DAYS,
        })}
      </StatusMessage>

      <FormField label={t("fieldTitle")}>
        <input
          className={INPUT_CLASS}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />
      </FormField>

      <FormField label={t("fieldArea")}>
        <input
          className={INPUT_CLASS}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder={t("areaPlaceholder")}
          required
          maxLength={80}
        />
      </FormField>

      <FormField label={t("fieldPrice")}>
        <input
          className={INPUT_CLASS}
          type="number"
          min={1}
          step={1}
          value={priceSgd}
          onChange={(e) => setPriceSgd(e.target.value)}
          required
        />
      </FormField>

      <FormField label={t("fieldContact")}>
        <input
          className={INPUT_CLASS}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t("contactPlaceholder")}
          required
          maxLength={120}
        />
      </FormField>

      <FormField label={t("fieldDescription")}>
        <textarea
          className={INPUT_CLASS}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={2000}
        />
      </FormField>

      <FormField label={t("fieldPhotos")}>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading || pending || imagePaths.length >= MAX_ROOM_IMAGES}
            onChange={(e) => void onFileChange(e)}
            className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-strong"
          />
          <p className="text-xs text-ink-subtle">
            {uploading ? t("uploading") : t("photoHint", { count: MAX_ROOM_IMAGES })}
          </p>
          {imagePaths.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {imagePaths.map((path) => {
                const url = roomImageUrl(path);
                return (
                  <li key={path} className="relative">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded-lg border border-border object-cover"
                      />
                    ) : null}
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 text-xs text-white"
                      onClick={() =>
                        setImagePaths((prev) => prev.filter((p) => p !== path))
                      }
                      aria-label={t("removePhoto")}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </FormField>

      {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
      {success ? <StatusMessage variant="success">{t("postSuccess")}</StatusMessage> : null}

      <Button type="submit" disabled={pending || uploading}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
