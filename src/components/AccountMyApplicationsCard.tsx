"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";
import JobApplicationMessages from "@/components/JobApplicationMessages";
import type { JobApplicationWithJob } from "@/lib/jobListings.server";
import type { AppLocale } from "@/i18n/routing";

type AccountMyApplicationsCardProps = {
  locale: AppLocale;
  applications: JobApplicationWithJob[];
};

const STATUS_KEY: Record<string, string> = {
  pending: "appStatusPending",
  reviewed: "appStatusReviewed",
  closed: "appStatusClosed",
};

export default function AccountMyApplicationsCard({
  locale,
  applications,
}: AccountMyApplicationsCardProps) {
  const t = useTranslations("account");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">{t("myAppsTitle")}</h2>
          <p className="text-sm text-ink-muted">{t("myAppsHint")}</p>
        </div>
        <LinkButton href="/jobs" locale={locale} size="sm" variant="secondary">
          {t("browseJobs")}
        </LinkButton>
      </div>

      {applications.length === 0 ? (
        <StatusMessage variant="info">{t("myAppsEmpty")}</StatusMessage>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => {
            const title = app.job_listings?.title ?? t("unknownJob");
            const jobLive = app.job_listings?.status === "published";
            const statusKey = STATUS_KEY[app.status] ?? "appStatusPending";
            const isOpen = openId === app.id;
            return (
              <li
                key={app.id}
                className="rounded-xl border border-border bg-surface-muted p-3 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {jobLive ? (
                      <Link
                        href={`/jobs/${app.job_id}`}
                        locale={locale}
                        className="font-semibold text-brand-strong underline"
                      >
                        {title}
                      </Link>
                    ) : (
                      <p className="font-semibold text-ink">{title}</p>
                    )}
                    <p className="text-xs text-ink-subtle">
                      {new Date(app.created_at).toLocaleString()} · {t(statusKey)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setOpenId(isOpen ? null : app.id)}
                  >
                    {isOpen ? t("hideMessages") : t("openMessages")}
                  </Button>
                </div>
                <p className="line-clamp-2 text-sm text-ink-muted">{app.cover_note}</p>
                {isOpen ? <JobApplicationMessages applicationId={app.id} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
