import type { ReactNode } from "react";

/**
 * Shared card chrome (rounded corners, border, padding) that most pages
 * render their content inside.
 *
 * The home feed (`src/app/[locale]/page.tsx`) deliberately does NOT use
 * this component — a news feed needs to run edge-to-edge to the screen,
 * so it renders directly inside `<main>` instead of inside this card.
 */
export default function PageCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      {children}
    </section>
  );
}
