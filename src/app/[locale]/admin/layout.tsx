import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import type { ReactNode } from "react";
import { checkAdminAuth, isSupabaseConfiguredServer } from "@/lib/authz";
import { routing, type AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Server-side admin layout guard.
 *
 * This layout protects all /[locale]/admin/* routes by checking:
 * 1. If Supabase is configured
 * 2. If user is authenticated (redirect to login if not)
 * 3. If user has admin role in profiles table (show error if not)
 *
 * Role source: profiles.role (NOT raw_user_meta_data for security)
 */
export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    redirect("/en/admin");
  }

  const resolvedLocale = locale as AppLocale;

  // Check if Supabase is configured
  if (!isSupabaseConfiguredServer) {
    return (
      <div className="rounded-2xl border border-danger-border bg-danger-soft p-6 text-center">
        <h2 className="text-lg font-semibold text-danger">
          Configuration Error / ပြင်ဆင်မှု အမှား
        </h2>
        <p className="mt-2 text-sm text-danger">
          Supabase is not configured. Please set environment variables in{" "}
          <code className="rounded bg-surface px-1">.env.local</code>.
        </p>
      </div>
    );
  }

  // Check admin authorization
  const authResult = await checkAdminAuth();

  // Not authenticated => redirect to login
  if (authResult.status === "not_authenticated") {
    redirect(`/${resolvedLocale}/login?next=/${resolvedLocale}/admin/payments`);
  }

  // Not admin => show not authorized message
  if (authResult.status === "not_admin") {
    return (
      <div className="rounded-lg border border-warning-border bg-warning-soft p-6 text-center">
        <div className="mb-3 text-3xl" aria-hidden="true">
          🔒
        </div>
        <h2 className="text-lg font-semibold text-warning">
          Access Denied / ဝင်ရောက်ခွင့် ငြင်းပယ်ခံရသည်
        </h2>
        <p className="mt-2 text-sm text-warning">
          You do not have permission to access this area.
          <span className="block mt-1 text-xs">
            ဤနေရာကို ဝင်ရောက်ခွင့် မရှိပါ။
          </span>
        </p>
        <p className="mt-3 text-xs text-warning">
          Your current role:{" "}
          <code className="rounded bg-warning-soft px-1.5 py-0.5 font-mono">
            {authResult.role}
          </code>
          <span className="mx-2">|</span>
          Required:{" "}
          <code className="rounded bg-warning-soft px-1.5 py-0.5 font-mono">
            admin
          </code>
        </p>
        <p className="mt-4 text-xs text-warning">
          Contact a super-admin to request admin access.
          <span className="block">Super-admin ကို ဆက်သွယ်ပါ။</span>
        </p>
        <div className="mt-4">
          <a
            href={`/${resolvedLocale}`}
            className="inline-block rounded-lg bg-warning px-4 py-2 text-sm font-medium text-warning-soft hover:opacity-90"
          >
            ← Back to Home / ပင်မစာမျက်နှာ
          </a>
        </div>
      </div>
    );
  }

  // Not configured (edge case - already handled above)
  if (authResult.status === "not_configured") {
    return (
      <div className="rounded-lg border border-danger-border bg-danger-soft p-6 text-center">
        <p className="text-danger">Supabase configuration error.</p>
      </div>
    );
  }

  // Authorized - render admin content
  return (
    <div className="space-y-4">
      {/* Admin header badge */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent-border bg-accent-soft px-4 py-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white" aria-hidden="true">
          ✓
        </span>
        <span className="text-sm font-semibold text-accent">
          Admin Panel / စီမံခန့်ခွဲသူ
        </span>
        <span className="ml-auto truncate text-xs text-accent">
          {authResult.profile.email}
        </span>
      </div>

      {/* Admin sub-nav */}
      <div className="flex gap-2">
        <Link
          href="/admin/payments"
          locale={resolvedLocale}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-accent-border hover:text-accent"
        >
          Payments / ငွေပေးချေမှု
        </Link>
        <Link
          href="/admin/analytics"
          locale={resolvedLocale}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-accent-border hover:text-accent"
        >
          Analytics / စာရင်းခွဲခြမ်း
        </Link>
        <Link
          href="/admin/news"
          locale={resolvedLocale}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-accent-border hover:text-accent"
        >
          News / သတင်း
        </Link>
      </div>

      {/* Admin content */}
      {children}
    </div>
  );
}
