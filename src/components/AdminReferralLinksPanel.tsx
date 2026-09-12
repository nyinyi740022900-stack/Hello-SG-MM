"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import {
  REFERRAL_LINK_TYPES,
  REFERRAL_MENU_CATEGORIES,
  REFERRAL_MENU_CATEGORY_LABELS,
  REFERRAL_PLACEMENTS,
  REFERRAL_PLACEMENT_LABELS,
  REFERRAL_PLACEMENT_META,
  placementsForCategory,
  type ReferralLinkRow,
  type ReferralLinkType,
  type ReferralMenuCategory,
  type ReferralPlacement,
} from "@/lib/accountsGuide";
import {
  INCOME_PARTNER_TEMPLATES,
  templatesForPlacement,
  type IncomePartnerTemplate,
} from "@/lib/incomePartnerTemplates";

type AdminReferralLinksPanelProps = {
  initialLinks: ReferralLinkRow[];
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  url: string;
  linkType: ReferralLinkType;
  placement: ReferralPlacement;
  ctaLabel: string;
  partnerName: string;
  isActive: boolean;
  sortOrder: number;
};

type CategoryFilter = "all" | ReferralMenuCategory;

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  url: "",
  linkType: "affiliate",
  placement: "remittance",
  ctaLabel: "Open link",
  partnerName: "",
  isActive: true,
  sortOrder: 0,
};

function statusLabel(link: ReferralLinkRow): {
  text: string;
  className: string;
} {
  if (!link.is_active) {
    return { text: "Inactive", className: "bg-surface text-ink-subtle border-border" };
  }
  if (link.link_type === "affiliate") {
    return {
      text: "Affiliate — earning",
      className: "bg-success-soft text-success border-transparent",
    };
  }
  return {
    text: "Invitation — paste tracking URL",
    className: "bg-warning-soft text-warning border-transparent",
  };
}

export default function AdminReferralLinksPanel({
  initialLinks,
}: AdminReferralLinksPanelProps) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [showInactive, setShowInactive] = useState(true);

  const editing = Boolean(form.id);
  const formMeta = REFERRAL_PLACEMENT_META[form.placement];
  const formTemplates = templatesForPlacement(form.placement);

  const sorted = useMemo(
    () =>
      [...links].sort((a, b) => {
        if (a.placement !== b.placement) {
          return (
            REFERRAL_PLACEMENTS.indexOf(a.placement) -
            REFERRAL_PLACEMENTS.indexOf(b.placement)
          );
        }
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.title.localeCompare(b.title);
      }),
    [links],
  );

  const filtered = useMemo(() => {
    return sorted.filter((link) => {
      if (!showInactive && !link.is_active) return false;
      if (categoryFilter === "all") return true;
      return REFERRAL_PLACEMENT_META[link.placement].category === categoryFilter;
    });
  }, [sorted, categoryFilter, showInactive]);

  const grouped = useMemo(() => {
    const map = new Map<ReferralPlacement, ReferralLinkRow[]>();
    for (const link of filtered) {
      const list = map.get(link.placement) ?? [];
      list.push(link);
      map.set(link.placement, list);
    }
    return map;
  }, [filtered]);

  const counts = useMemo(() => {
    const base = {
      all: links.length,
      exchange: 0,
      travel: 0,
      accounts: 0,
      affiliate: links.filter((l) => l.is_active && l.link_type === "affiliate").length,
      needsTracking: links.filter((l) => l.is_active && l.link_type === "invitation")
        .length,
    };
    for (const link of links) {
      base[REFERRAL_PLACEMENT_META[link.placement].category] += 1;
    }
    return base;
  }, [links]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setError(null);
    setMessage(null);
  }

  function startEdit(link: ReferralLinkRow) {
    setForm({
      id: link.id,
      title: link.title,
      description: link.description ?? "",
      url: link.url,
      linkType: link.link_type,
      placement: link.placement,
      ctaLabel: link.cta_label,
      partnerName: link.partner_name ?? "",
      isActive: link.is_active,
      sortOrder: link.sort_order,
    });
    setCategoryFilter(REFERRAL_PLACEMENT_META[link.placement].category);
    setError(null);
    setMessage(null);
  }

  /** Open edit focused on pasting a tracked affiliate URL. */
  function pasteTracking(link: ReferralLinkRow) {
    startEdit(link);
    setForm((prev) => ({
      ...prev,
      id: link.id,
      title: link.title,
      description: link.description ?? "",
      url: "",
      linkType: "affiliate",
      placement: link.placement,
      ctaLabel: link.cta_label,
      partnerName: link.partner_name ?? "",
      isActive: true,
      sortOrder: link.sort_order,
    }));
    setMessage(
      `Paste the ${link.partner_name ?? link.title} tracking URL below, then Save. Type is set to Affiliate.`,
    );
  }

  function applyTemplate(template: IncomePartnerTemplate) {
    const existing = links.find(
      (l) =>
        l.partner_name === template.partnerName &&
        l.placement === template.placement,
    );
    if (existing) {
      startEdit(existing);
      setMessage(
        `${template.partnerName} already exists — edit it and paste your tracking URL.`,
      );
      return;
    }
    setForm({
      title: template.title,
      description: template.description,
      url: template.url,
      linkType: template.linkType,
      placement: template.placement,
      ctaLabel: template.ctaLabel,
      partnerName: template.partnerName,
      isActive: true,
      sortOrder: template.sortOrder,
    });
    setCategoryFilter(REFERRAL_PLACEMENT_META[template.placement].category);
    setError(null);
    setMessage(
      `Filled ${template.partnerName}. When approved, use “Paste tracking URL” or edit and set Affiliate.`,
    );
  }

  function submit() {
    setError(null);
    setMessage(null);
    if (!form.url.trim().startsWith("http")) {
      setError("URL must start with https://");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/referral-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.id,
            title: form.title,
            description: form.description || null,
            url: form.url,
            linkType: form.linkType,
            placement: form.placement,
            ctaLabel: form.ctaLabel || "Open link",
            partnerName: form.partnerName || null,
            isActive: form.isActive,
            sortOrder: form.sortOrder,
          }),
        });
        const payload: unknown = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error: unknown }).error === "string"
              ? (payload as { error: string }).error
              : "Save failed.";
          setError(msg);
          return;
        }
        const link =
          typeof payload === "object" &&
          payload !== null &&
          "link" in payload
            ? (payload as { link: ReferralLinkRow }).link
            : null;
        if (link) {
          setLinks((prev) => {
            const without = prev.filter((row) => row.id !== link.id);
            return [...without, link];
          });
        }
        setMessage(editing ? "Link updated." : "Link added.");
        resetForm();
        router.refresh();
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  function activate(link: ReferralLinkRow) {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/admin/referral-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: link.id,
          title: link.title,
          description: link.description,
          url: link.url,
          linkType: link.link_type,
          placement: link.placement,
          ctaLabel: link.cta_label,
          partnerName: link.partner_name,
          isActive: true,
          sortOrder: link.sort_order,
        }),
      });
      if (!response.ok) {
        setError("Could not activate.");
        return;
      }
      setLinks((prev) =>
        prev.map((row) => (row.id === link.id ? { ...row, is_active: true } : row)),
      );
      setMessage("Link activated.");
      router.refresh();
    });
  }

  function deactivate(id: string) {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/admin/referral-links?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("Could not deactivate.");
        return;
      }
      setLinks((prev) =>
        prev.map((row) => (row.id === id ? { ...row, is_active: false } : row)),
      );
      setMessage("Link deactivated.");
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Permanently delete this link?")) return;
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/admin/referral-links?id=${id}&hard=1`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("Could not delete.");
        return;
      }
      setLinks((prev) => prev.filter((row) => row.id !== id));
      setMessage("Link deleted.");
      router.refresh();
    });
  }

  const placementOptions =
    categoryFilter === "all"
      ? REFERRAL_PLACEMENTS
      : placementsForCategory(categoryFilter);

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h3 className="font-semibold text-ink">Income overview</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs text-ink-subtle">Affiliate (earning)</p>
            <p className="text-2xl font-bold text-ink">{counts.affiliate}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs text-ink-subtle">Need tracking URL</p>
            <p className="text-2xl font-bold text-ink">{counts.needsTracking}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs text-ink-subtle">Total links</p>
            <p className="text-2xl font-bold text-ink">{counts.all}</p>
          </div>
        </div>
        <p className="text-sm text-ink-muted">
          When a partner approves you, open that row → <strong>Paste tracking URL</strong>{" "}
          → save as Affiliate. Cards show on Exchange, Travel, and Accounts Guide.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", `All (${counts.all})`],
            ["exchange", `Exchange (${counts.exchange})`],
            ["travel", `Travel (${counts.travel})`],
            ["accounts", `Accounts (${counts.accounts})`],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={categoryFilter === id ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setCategoryFilter(id);
              if (id !== "all") {
                const first = placementsForCategory(id)[0];
                if (first && !editing) {
                  setForm((prev) => ({ ...prev, placement: first }));
                }
              }
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-ink">
            {editing ? "Edit link — paste tracking URL here" : "Add / update referral link"}
          </h3>
          {editing ? (
            <Button variant="secondary" onClick={resetForm} disabled={pending}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <div className="rounded-xl border border-brand-soft-border bg-brand-soft p-3 text-sm text-brand-strong">
          <p className="font-medium">{formMeta.menuPath}</p>
          <p className="text-xs opacity-90">
            Public page: {formMeta.publicPath} · {formMeta.hint}
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            List 1 templates
            {categoryFilter !== "all"
              ? ` — ${REFERRAL_MENU_CATEGORY_LABELS[categoryFilter]}`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {(categoryFilter === "all"
              ? INCOME_PARTNER_TEMPLATES
              : INCOME_PARTNER_TEMPLATES.filter(
                  (t) =>
                    REFERRAL_PLACEMENT_META[t.placement].category === categoryFilter,
                )
            ).map((template) => (
              <Button
                key={template.id}
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => applyTemplate(template)}
              >
                {template.partnerName}
              </Button>
            ))}
          </div>
          {formTemplates.length > 0 && form.partnerName ? (
            <p className="text-xs text-ink-muted">
              Apply program:{" "}
              {INCOME_PARTNER_TEMPLATES.find((t) => t.partnerName === form.partnerName)
                ?.applyUrl ? (
                <a
                  href={
                    INCOME_PARTNER_TEMPLATES.find(
                      (t) => t.partnerName === form.partnerName,
                    )!.applyUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-strong underline"
                >
                  open signup page →
                </a>
              ) : (
                <span>no apply URL for this partner</span>
              )}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Title">
            <input
              className={INPUT_CLASS}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Remitly — send money home"
            />
          </FormField>
          <FormField label="Partner name">
            <input
              className={INPUT_CLASS}
              value={form.partnerName}
              onChange={(e) => setForm((prev) => ({ ...prev, partnerName: e.target.value }))}
              placeholder="Remitly / Agoda / Airalo"
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Tracking / product URL">
              <input
                className={INPUT_CLASS}
                value={form.url}
                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://… (paste affiliate link when you have it)"
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Short description (optional)">
              <textarea
                className={INPUT_CLASS}
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Shown near the partner card"
              />
            </FormField>
          </div>
          <FormField label="Link type">
            <select
              className={INPUT_CLASS}
              value={form.linkType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  linkType: e.target.value as ReferralLinkType,
                }))
              }
            >
              {REFERRAL_LINK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "affiliate"
                    ? "Affiliate (income — use with tracking URL)"
                    : "Invitation (starter / sponsor)"}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="App menu / page">
            <select
              className={INPUT_CLASS}
              value={form.placement}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  placement: e.target.value as ReferralPlacement,
                }))
              }
            >
              {placementOptions.map((placement) => (
                <option key={placement} value={placement}>
                  {REFERRAL_PLACEMENT_LABELS[placement]}
                </option>
              ))}
              {categoryFilter !== "all" &&
              !placementOptions.includes(form.placement) ? (
                <option value={form.placement}>
                  {REFERRAL_PLACEMENT_LABELS[form.placement]}
                </option>
              ) : null}
            </select>
          </FormField>
          <FormField label="Button label">
            <input
              className={INPUT_CLASS}
              value={form.ctaLabel}
              onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
            />
          </FormField>
          <FormField label="Sort order (0 = first in that page)">
            <input
              type="number"
              min={0}
              className={INPUT_CLASS}
              value={form.sortOrder}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sortOrder: Number(e.target.value) || 0,
                }))
              }
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active (visible on the public page for this menu)
          </label>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-success">{message}</p> : null}

        <Button onClick={submit} disabled={pending || !form.title.trim() || !form.url.trim()}>
          {pending ? "Saving…" : editing ? "Save changes" : "Add link"}
        </Button>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">
          Links by menu ({filtered.length}
          {filtered.length !== links.length ? ` of ${links.length}` : ""})
        </h3>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-subtle">
            No links in this category yet. Use a List 1 template above.
          </p>
        </Card>
      ) : (
        REFERRAL_MENU_CATEGORIES.filter((cat) =>
          categoryFilter === "all" ? true : cat === categoryFilter,
        ).map((cat) => {
          const placements = placementsForCategory(cat);
          const catLinks = placements.flatMap((p) => grouped.get(p) ?? []);
          if (catLinks.length === 0) return null;
          return (
            <Card key={cat} className="space-y-4">
              <div>
                <h3 className="font-semibold text-ink">
                  {REFERRAL_MENU_CATEGORY_LABELS[cat]}
                </h3>
                <p className="text-xs text-ink-subtle">
                  {REFERRAL_PLACEMENT_META[placements[0]].menuPath}
                </p>
              </div>
              {placements.map((placement) => {
                const rows = grouped.get(placement);
                if (!rows?.length) return null;
                return (
                  <div key={placement} className="space-y-2">
                    <p className="text-sm font-medium text-ink-muted">
                      {REFERRAL_PLACEMENT_LABELS[placement]}
                      <span className="ml-2 text-xs font-normal text-ink-subtle">
                        → {REFERRAL_PLACEMENT_META[placement].publicPath}
                      </span>
                    </p>
                    <ul className="space-y-2">
                      {rows.map((link) => {
                        const badge = statusLabel(link);
                        const apply = INCOME_PARTNER_TEMPLATES.find(
                          (t) =>
                            t.partnerName === link.partner_name &&
                            t.placement === link.placement,
                        );
                        return (
                          <li
                            key={link.id}
                            className="rounded-xl border border-border bg-surface-muted p-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-ink">{link.title}</p>
                                  <span
                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                                  >
                                    {badge.text}
                                  </span>
                                </div>
                                {link.partner_name ? (
                                  <p className="text-xs text-ink-subtle">
                                    Partner: {link.partner_name}
                                  </p>
                                ) : null}
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block break-all text-xs text-brand-strong underline"
                                >
                                  {link.url}
                                </a>
                                {apply ? (
                                  <p className="text-xs text-ink-muted">
                                    Program:{" "}
                                    <a
                                      href={apply.applyUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      apply / dashboard →
                                    </a>
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {link.link_type === "invitation" && link.is_active ? (
                                  <Button
                                    size="sm"
                                    onClick={() => pasteTracking(link)}
                                    disabled={pending}
                                  >
                                    Paste tracking URL
                                  </Button>
                                ) : null}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => startEdit(link)}
                                  disabled={pending}
                                >
                                  Edit
                                </Button>
                                {link.is_active ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => deactivate(link.id)}
                                    disabled={pending}
                                  >
                                    Deactivate
                                  </Button>
                                ) : (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => activate(link)}
                                    disabled={pending}
                                  >
                                    Activate
                                  </Button>
                                )}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => remove(link.id)}
                                  disabled={pending}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </Card>
          );
        })
      )}
    </div>
  );
}
