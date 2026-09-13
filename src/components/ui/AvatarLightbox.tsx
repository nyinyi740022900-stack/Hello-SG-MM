"use client";

import { useEffect, useState } from "react";

/**
 * Wraps an avatar thumbnail so clicking it opens the photo full-size.
 *
 * Renders a plain, non-interactive wrapper when there is no photo (initials
 * only) — there is nothing to zoom into, and it keeps the fallback exactly as
 * unclickable as it was before this existed.
 */
export default function AvatarLightbox({
  avatarUrl,
  label,
  className,
  children,
}: {
  avatarUrl: string | null;
  /** Accessible name for the zoomed photo, e.g. the commenter's display name. */
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!avatarUrl) {
    return <span className={className}>{children}</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        aria-label={label ? `View photo — ${label}` : "View photo"}
      >
        {children}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- full-size view of an arbitrary avatar URL, not a static/local asset */}
          <img
            src={avatarUrl}
            alt={label ?? ""}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
