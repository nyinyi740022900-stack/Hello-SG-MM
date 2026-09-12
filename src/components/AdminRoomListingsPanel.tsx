"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import {
  formatPriceSgd,
  roomImageUrl,
  type RoomListingRow,
  type RoomListingStatus,
} from "@/lib/roomListings";

type AdminRoomListingsPanelProps = {
  initialListings: RoomListingRow[];
};

const STATUS_LABEL: Record<RoomListingStatus, string> = {
  pending: "Pending",
  published: "Published",
  rejected: "Rejected",
  expired: "Expired / hidden",
};

export default function AdminRoomListingsPanel({
  initialListings,
}: AdminRoomListingsPanelProps) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [filter, setFilter] = useState<"all" | RoomListingStatus>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(
    () =>
      filter === "all" ? listings : listings.filter((row) => row.status === filter),
    [filter, listings],
  );

  const counts = useMemo(() => {
    const base = { all: listings.length, pending: 0, published: 0, rejected: 0, expired: 0 };
    for (const row of listings) base[row.status] += 1;
    return base;
  }, [listings]);

  function run(
    action: "approve" | "reject" | "expire" | "delete",
    id: string,
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const body =
          action === "approve"
            ? { action, id, adminNote: notes[id] || null }
            : action === "reject"
              ? { action, id, adminNote: notes[id]?.trim() || "Does not meet guidelines" }
              : { action, id };

        const response = await fetch("/api/admin/room-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as {
          listing?: RoomListingRow;
          error?: string;
        };
        if (!response.ok) {
          setError(payload.error ?? "Action failed.");
          return;
        }
        if (action === "delete") {
          setListings((prev) => prev.filter((row) => row.id !== id));
          setMessage("Deleted.");
        } else if (payload.listing) {
          setListings((prev) =>
            prev.map((row) => (row.id === id ? payload.listing! : row)),
          );
          setMessage(
            action === "approve"
              ? "Published."
              : action === "reject"
                ? "Rejected."
                : "Marked expired.",
          );
        }
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", `Pending (${counts.pending})`],
            ["published", `Published (${counts.published})`],
            ["rejected", `Rejected (${counts.rejected})`],
            ["expired", `Expired (${counts.expired})`],
            ["all", `All (${counts.all})`],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? "primary" : "secondary"}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
      {message ? <StatusMessage variant="success">{message}</StatusMessage> : null}

      {visible.length === 0 ? (
        <StatusMessage variant="info">No listings in this filter.</StatusMessage>
      ) : (
        visible.map((row) => {
          const thumb = row.image_paths[0] ? roomImageUrl(row.image_paths[0]) : null;
          return (
            <Card key={row.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{row.title}</p>
                  <p className="text-xs text-ink-subtle">
                    {row.area} · {formatPriceSgd(Number(row.price_sgd), "en")} / month ·{" "}
                    {STATUS_LABEL[row.status]} · reports {row.report_count}
                  </p>
                </div>
                <span className="text-xs text-ink-subtle">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1 space-y-1 text-sm text-ink-muted">
                  <p className="whitespace-pre-line">{row.description}</p>
                  <p>
                    Contact: <span className="font-medium text-ink">{row.contact}</span>
                  </p>
                </div>
              </div>

              <FormField label="Admin note (required for reject)">
                <input
                  className={INPUT_CLASS}
                  value={notes[row.id] ?? row.admin_note ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                  disabled={pending}
                />
              </FormField>

              <div className="flex flex-wrap gap-2">
                {row.status === "pending" || row.status === "rejected" ? (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => run("approve", row.id)}
                  >
                    Approve
                  </Button>
                ) : null}
                {row.status === "pending" || row.status === "published" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run("reject", row.id)}
                  >
                    Reject
                  </Button>
                ) : null}
                {row.status === "published" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run("expire", row.id)}
                  >
                    Hide / expire
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("Delete this listing permanently?")) {
                      run("delete", row.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
