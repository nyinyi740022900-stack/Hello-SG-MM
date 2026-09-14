import SponsorInquiryForm from "@/components/SponsorInquiryForm";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import { INCOME_PARTNER_TEMPLATES } from "@/lib/incomePartnerTemplates";
import { REFERRAL_PLACEMENT_LABELS } from "@/lib/accountsGuide";

/**
 * Owner-facing income plan: List 1 partners + Travel/Exchange placements.
 * Government services are intentionally excluded from monetisation.
 */
export default function OwnerIncomePage() {
  const byPlacement = {
    remittance: INCOME_PARTNER_TEMPLATES.filter((t) => t.placement === "remittance"),
    travel: INCOME_PARTNER_TEMPLATES.filter((t) => t.placement === "travel"),
    bank: INCOME_PARTNER_TEMPLATES.filter((t) => t.placement === "bank"),
  };

  return (
    <PageCard>
      <section className="space-y-8">
        <PageHeader
          title="Income plan (List 1 + Travel)"
          subtitle="Non-government partners only. App stays free for workers. Replace starter URLs with your tracked affiliate links under Admin → Referrals."
        />

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Do this now</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
            <li>
              Open each partner program link below and apply (Agoda, Airalo first).
            </li>
            <li>
              When approved, go to <strong>Admin → Referrals</strong>, filter by Exchange /
              Travel / Accounts, click <strong>Paste tracking URL</strong>, save as{" "}
              <strong>Affiliate</strong>.
            </li>
            <li>
              Confirm cards appear on <strong>Exchange</strong> (`remittance`) and{" "}
              <strong>Travel</strong> (`travel`).
            </li>
            <li>Optional: OCBC FRANK / Revolut for Accounts Guide (`bank`).</li>
            <li>Sponsored ads / Contact form stay available for direct B2B deals.</li>
          </ol>
        </Card>

        {(
          [
            ["remittance", "Exchange — remittance"],
            ["travel", "Travel — hotels / eSIM / card"],
            ["bank", "Accounts — bank / wallet"],
          ] as const
        ).map(([key, label]) => (
          <Card key={key} className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">{label}</h2>
            <p className="text-xs text-ink-subtle">
              Admin placement: {REFERRAL_PLACEMENT_LABELS[key]}
            </p>
            <ul className="space-y-3">
              {byPlacement[key].map((partner) => (
                <li
                  key={partner.id}
                  className="rounded-xl border border-border bg-surface-muted p-3"
                >
                  <p className="font-medium text-ink">{partner.partnerName}</p>
                  <p className="mt-1 text-sm text-ink-muted">{partner.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <a
                      href={partner.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-strong underline"
                    >
                      Apply / program →
                    </a>
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted underline"
                    >
                      Product page
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <div className="rounded-lg border border-border bg-brand-soft p-4">
          <h3 className="font-semibold text-brand-strong">Promise to workers</h3>
          <p className="mt-1 text-sm text-brand-strong">
            Essential guides stay free. Partner links are labelled. We do not sell user
            data. Government pages are never monetised.
          </p>
        </div>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Other income (not List 1)</h2>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>Sponsored ads — Admin → Ads</li>
            <li>Direct sponsor inquiry — form below</li>
            <li>Passport PDF export (paid convenience) — when enabled</li>
          </ul>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-ink">Interested in sponsoring?</h2>
          <p className="text-sm text-ink-muted">
            For businesses that serve migrant workers (remittance, travel, SIM, training —
            not government services).
          </p>
          <SponsorInquiryForm />
        </div>
      </section>
    </PageCard>
  );
}
