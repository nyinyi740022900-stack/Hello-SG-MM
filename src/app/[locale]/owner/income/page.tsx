import SponsorInquiryForm from "@/components/SponsorInquiryForm";
import { PageHeader } from "@/components/ui/Card";

/**
 * Owner Income Dashboard Page
 *
 * This page explains how the app generates income and provides
 * a way for potential sponsors to get in touch.
 *
 * Monetization channels explained:
 * 1. Sponsored Ads - Banner ads from relevant businesses
 * 2. Premium Features - Future paid features for agencies
 * 3. Sponsorships - Direct partnerships with organizations
 */
export default function OwnerIncomePage() {
  return (
    <section className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="App Monetization & Sponsorship"
        subtitle="Learn how this free app sustains itself and how you can partner with us."
      />

      {/* Income Channels Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-muted">
          How We Generate Income
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Sponsored Ads Card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft">
              <span className="text-xl">📢</span>
            </div>
            <h3 className="mb-2 font-semibold text-ink">Sponsored Ads</h3>
            <p className="text-sm text-ink-muted">
              Relevant businesses (remittance services, employment agencies, etc.) can
              display non-intrusive banner ads to reach our audience.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-subtle">
              <li>• Impression & click tracking</li>
              <li>• Targeted placements</li>
              <li>• Performance reports</li>
            </ul>
          </div>

          {/* Premium Features Card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
              <span className="text-xl">⭐</span>
            </div>
            <h3 className="mb-2 font-semibold text-ink">Premium Features</h3>
            <p className="text-sm text-ink-muted">
              Future paid features for agencies and employers who want enhanced visibility
              and tools.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-subtle">
              <li>• Featured job listings</li>
              <li>• Priority support</li>
              <li>• Analytics dashboard</li>
            </ul>
          </div>

          {/* Sponsorships Card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-soft">
              <span className="text-xl">🤝</span>
            </div>
            <h3 className="mb-2 font-semibold text-ink">Sponsorships</h3>
            <p className="text-sm text-ink-muted">
              Organizations supporting migrant workers can sponsor specific features or
              content sections.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-subtle">
              <li>• Brand visibility</li>
              <li>• Community goodwill</li>
              <li>• Custom partnerships</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Our Promise Section */}
      <div className="rounded-lg border-l-4 border-brand bg-brand-soft p-4">
        <h3 className="font-semibold text-brand-strong">Our Promise</h3>
        <p className="mt-1 text-sm text-brand-strong">
          This app will always remain free for migrant workers. Any monetization is
          designed to sustain the platform while keeping the user experience clean and
          helpful. We do not sell user data.
        </p>
      </div>

      {/* Ad Metrics Info (for transparency) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-muted">
          Ad Performance Tracking
        </h2>
        <p className="text-sm text-ink-muted">
          We track anonymous metrics to measure ad effectiveness and provide value to our
          sponsors:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded border border-border bg-surface-muted p-3">
            <span className="text-lg">👁️</span>
            <div>
              <h4 className="font-medium text-ink-muted">Impressions</h4>
              <p className="text-xs text-ink-subtle">
                How many times an ad is displayed to users.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded border border-border bg-surface-muted p-3">
            <span className="text-lg">👆</span>
            <div>
              <h4 className="font-medium text-ink-muted">Clicks</h4>
              <p className="text-xs text-ink-subtle">
                How many users clicked through to learn more.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor Inquiry Form Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-muted">
          Interested in Sponsoring?
        </h2>
        <p className="text-sm text-ink-muted">
          If your organization serves migrant workers and you&apos;d like to reach our
          community, we&apos;d love to hear from you.
        </p>
        <SponsorInquiryForm />
      </div>
    </section>
  );
}
