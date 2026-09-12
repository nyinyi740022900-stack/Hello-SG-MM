"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  avatarUrl,
  clearAvatar,
  fetchEditableProfile,
  initialsFor,
  updateDisplayName,
  uploadAvatar,
  type EditableProfile,
} from "@/lib/profile";
import StatusMessage from "@/components/ui/StatusMessage";

function roleClass(role: EditableProfile["role"] | null) {
  if (role === "admin") return "border-accent-border bg-accent-soft text-accent";
  if (role === "agency") return "border-warning-border bg-warning-soft text-warning";
  return "border-border bg-surface-muted text-ink-muted";
}

export default function AccountProfileCard() {
  const { user, isLoading } = useAuth();
  const t = useTranslations("account");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) {
        queueMicrotask(() => {
          setProfile(null);
          setDisplayName("");
          setPreviewUrl(null);
        });
        return;
      }
      setIsLoadingProfile(true);
      const { data, error } = await fetchEditableProfile(user.id);
      if (!mounted) return;
      if (error) {
        setMessage({ tone: "error", text: error });
      }
      setProfile(data);
      setDisplayName(data?.display_name ?? "");
      setPreviewUrl(avatarUrl(data?.avatar_path));
      setIsLoadingProfile(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (isLoading) {
    return <StatusMessage variant="loading">{t("loading")}</StatusMessage>;
  }

  if (!user) {
    return <StatusMessage variant="warning">{t("loginRequired")}</StatusMessage>;
  }

  const role = profile?.role ?? "user";
  const initials = initialsFor(displayName || profile?.display_name, user.email);

  const onSaveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setIsSavingName(true);
    const { error } = await updateDisplayName(user.id, displayName);
    setIsSavingName(false);
    if (error) {
      setMessage({ tone: "error", text: error });
      return;
    }
    setProfile((prev) =>
      prev
        ? { ...prev, display_name: displayName.trim() || null }
        : prev,
    );
    setMessage({ tone: "ok", text: t("savedName") });
  };

  const onPickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessage(null);
    setIsUploadingPhoto(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const { path, error } = await uploadAvatar(user.id, file);
    setIsUploadingPhoto(false);

    if (error || !path) {
      setPreviewUrl(avatarUrl(profile?.avatar_path));
      setMessage({ tone: "error", text: error ?? t("photoFailed") });
      URL.revokeObjectURL(localPreview);
      return;
    }

    setProfile((prev) => (prev ? { ...prev, avatar_path: path } : prev));
    setPreviewUrl(avatarUrl(path));
    URL.revokeObjectURL(localPreview);
    setMessage({ tone: "ok", text: t("savedPhoto") });
  };

  const onRemovePhoto = async () => {
    setMessage(null);
    setIsUploadingPhoto(true);
    const { error } = await clearAvatar(user.id);
    setIsUploadingPhoto(false);
    if (error) {
      setMessage({ tone: "error", text: error });
      return;
    }
    setProfile((prev) => (prev ? { ...prev, avatar_path: null } : prev));
    setPreviewUrl(null);
    setMessage({ tone: "ok", text: t("removedPhoto") });
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-ink">{t("title")}</h3>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${roleClass(role)}`}>
          {isLoadingProfile
            ? t("loadingRole")
            : t("roleLabel", { role: role.toUpperCase() })}
        </span>
      </div>

      <p className="mt-2 text-sm text-ink-muted">{t("hint")}</p>

      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <span
            className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xl font-semibold text-brand-strong"
            aria-hidden="true"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview + storage URL
              <img
                src={previewUrl}
                alt=""
                className="h-20 w-20 object-cover"
              />
            ) : (
              initials
            )}
          </span>
        </div>

        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={onPickPhoto}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
            >
              {isUploadingPhoto ? t("uploadingPhoto") : t("changePhoto")}
            </button>
            {profile?.avatar_path ? (
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => void onRemovePhoto()}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface-muted disabled:opacity-60"
              >
                {t("removePhoto")}
              </button>
            ) : null}
          </div>
          <p className="text-xs text-ink-subtle">{t("photoHint")}</p>
        </div>
      </div>

      <form onSubmit={onSaveName} className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-ink-subtle">{t("displayName")}</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={40}
            placeholder={t("displayNamePlaceholder")}
            className="mt-1 w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            autoComplete="nickname"
          />
        </label>

        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs text-ink-subtle">{t("email")}</p>
          <p className="mt-1 text-sm font-medium text-ink break-all">{user.email}</p>
        </div>

        <button
          type="submit"
          disabled={isSavingName}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
        >
          {isSavingName ? t("saving") : t("saveName")}
        </button>
      </form>

      {message ? (
        <p
          className={[
            "mt-3 text-sm",
            message.tone === "ok" ? "text-success" : "text-danger",
          ].join(" ")}
          role="status"
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
