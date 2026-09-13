import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import AuthGate from "@/components/AuthGate";
import StatusMessage from "@/components/ui/StatusMessage";
import JobApplicationMessages from "@/components/JobApplicationMessages";
import JobFeaturedPaymentForm from "@/components/JobFeaturedPaymentForm";
import JobListingDeleteButton from "@/components/JobListingDeleteButton";
import { routing, type AppLocale } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/authz";
import {
  listApplicationsForPoster,
  listJobsForPoster,
} from "@/lib/jobListings.server";
import { formatJobExpiry, isJobFeatured } from "@/lib/jobListings";

export const dynamic = "force-dynamic";

export default async function JobsMinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const resolvedLocale = locale as AppLocale;
  const t = await getTranslations("jobs");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const myJobs = user ? await listJobsForPoster(user.id) : [];
  const applications = user ? await listApplicationsForPoster(user.id) : [];

  return (
    <PageCard>
      <section className="space-y-6">
        <Link
          href="/jobs"
          locale={resolvedLocale}
          className="text-sm font-medium text-brand-strong underline"
        >
          {t("backToList")}
        </Link>
        <PageHeader eyebrow={t("badge")} title={t("mineTitle")} subtitle={t("mineSubtitle")} />

        <AuthGate locale={resolvedLocale}>
          <div className="space-y-6">
            <Card className="space-y-3">
              <h3 className="font-semibold text-ink">{t("myListings")}</h3>
              {myJobs.length === 0 ? (
                <p className="text-sm text-ink-muted">{t("noMyListings")}</p>
              ) : (
                <ul className="space-y-4">
                  {myJobs.map((job) => (
                    <li
                      key={job.id}
                      className="rounded-xl border border-border bg-surface-muted p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-ink">{job.title}</p>
                          <p className="text-xs text-ink-subtle">
                            {job.status}
                            {isJobFeatured(job) ? ` · ${t("featured")}` : ""}
                            {job.status === "published" &&
                            formatJobExpiry(job.expires_at, resolvedLocale)
                              ? ` · ${t("expires")}: ${formatJobExpiry(job.expires_at, resolvedLocale)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {job.status === "published" ? (
                            <Link
                              href={`/jobs/${job.id}`}
                              locale={resolvedLocale}
                              className="text-xs font-medium text-brand-strong underline"
                            >
                              {t("viewPublic")}
                            </Link>
                          ) : null}
                          <JobListingDeleteButton jobId={job.id} />
                        </div>
                      </div>
                      {job.status === "published" && !isJobFeatured(job) ? (
                        <JobFeaturedPaymentForm jobId={job.id} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="space-y-3">
              <h3 className="font-semibold text-ink">{t("applicationsInbox")}</h3>
              {applications.length === 0 ? (
                <StatusMessage variant="info">{t("noApplications")}</StatusMessage>
              ) : (
                <ul className="space-y-4">
                  {applications.map((app) => (
                    <li
                      key={app.id}
                      className="rounded-xl border border-border bg-surface p-3 space-y-2"
                    >
                      <p className="font-semibold text-ink">
                        {app.job_listings?.title ?? app.job_id}
                      </p>
                      <p className="text-xs text-ink-subtle">
                        {new Date(app.created_at).toLocaleString()} · {app.status}
                      </p>
                      <p className="whitespace-pre-line text-sm text-ink-muted">
                        {app.cover_note}
                      </p>
                      <JobApplicationMessages applicationId={app.id} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </AuthGate>
      </section>
    </PageCard>
  );
}
