"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { LinkButton } from "@/components/ui/Button";
import {
  avatarUrl,
  fetchEditableProfile,
  initialsFor,
  type EditableProfile,
} from "@/lib/profile";

type AuthStatusProps = {
  locale: AppLocale;
};

export default function AuthStatus({ locale }: AuthStatusProps) {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("auth");
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!user) {
        queueMicrotask(() => setProfile(null));
        return;
      }
      const { data } = await fetchEditableProfile(user.id);
      if (!mounted) return;
      if (data) {
        setProfile(data);
        return;
      }
      const metadataRole =
        typeof user.user_metadata?.role === "string"
          ? (user.user_metadata.role as EditableProfile["role"])
          : "user";
      setProfile({
        id: user.id,
        email: user.email ?? "",
        role: metadataRole,
        display_name: null,
        avatar_path: null,
      });
    };
    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  if (isLoading) {
    return (
      <span className="inline-flex h-9 items-center">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ink-subtle" aria-hidden="true" />
        <span className="hidden pl-2 text-xs text-ink-subtle sm:inline">{t("checkingSession")}</span>
      </span>
    );
  }

  if (!user) {
    return (
      // Six languages made the header crowded enough to truncate the product
      // name on a phone. Sign-up stays visible; sign-in moves into the menu,
      // where an existing account holder will look for it anyway.
      <div className="flex items-center gap-1.5 sm:gap-2">
        <LinkButton
          href="/login"
          locale={locale}
          variant="secondary"
          size="md"
          // max-sm:hidden, not `hidden sm:inline-flex` — LinkButton's base class
          // already sets inline-flex, and two unprefixed display utilities are
          // decided by CSS order, not by which is written last.
          className="h-9 px-2.5 text-xs max-sm:hidden sm:px-4"
        >
          {t("loginTitle")}
        </LinkButton>
        <LinkButton href="/register" locale={locale} variant="primary" size="md" className="h-9 px-2.5 text-xs sm:px-4">
          {t("registerTitle")}
        </LinkButton>
      </div>
    );
  }

  const role = profile?.role ?? null;
  const photoUrl = avatarUrl(profile?.avatar_path);
  const avatarLabel = initialsFor(profile?.display_name, user.email);
  const menuName = profile?.display_name?.trim() || user.email;
  const isAdmin = role === "admin";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label={menuName ?? undefined}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface p-0.5 shadow-sm transition hover:border-border-strong sm:h-10 sm:gap-2 sm:pr-3"
      >
        <span
          className={[
            "inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold sm:h-7 sm:w-7",
            isAdmin ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand-strong",
          ].join(" ")}
          aria-hidden="true"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            avatarLabel
          )}
        </span>
        <span className="hidden max-w-36 truncate text-xs font-medium text-ink-muted sm:inline">
          {menuName}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`hidden h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform sm:inline ${isMenuOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isMenuOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-surface p-2 shadow-xl"
        >
          <div className="rounded-lg bg-surface-muted px-3 py-2">
            {profile?.display_name ? (
              <p className="truncate text-xs font-semibold text-ink">{profile.display_name}</p>
            ) : null}
            <p
              className={[
                "truncate text-xs",
                profile?.display_name ? "mt-0.5 text-ink-subtle" : "font-semibold text-ink",
              ].join(" ")}
            >
              {user.email}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-subtle">
              {isAdmin ? t("menuRoleAdmin") : t("menuRoleUser")}
            </p>
          </div>

          <div className="mt-2 grid gap-1">
            <Link
              href="/account"
              locale={locale}
              role="menuitem"
              className="rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("menuAccount")}
            </Link>
            {isAdmin ? (
              <>
                <Link
                  href="/admin/payments"
                  locale={locale}
                  role="menuitem"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("menuAdminPanel")}
                </Link>
                <Link
                  href="/admin/analytics"
                  locale={locale}
                  role="menuitem"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("menuAdminAnalytics")}
                </Link>
                <Link
                  href="/admin/news"
                  locale={locale}
                  role="menuitem"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("menuAdminNews")}
                </Link>
                <Link
                  href="/admin/housing"
                  locale={locale}
                  role="menuitem"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Housing
                </Link>
                <Link
                  href="/admin/jobs"
                  locale={locale}
                  role="menuitem"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Jobs
                </Link>
              </>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="rounded-lg px-3 py-2 text-left text-sm text-danger transition hover:bg-danger-soft"
              onClick={async () => {
                setIsMenuOpen(false);
                await signOut();
                router.replace(pathname, { locale });
              }}
            >
              {t("logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
