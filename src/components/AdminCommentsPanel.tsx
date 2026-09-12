"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AdminCommentReport } from "@/lib/pageComments";

type AdminCommentsPanelProps = {
  initialReports: AdminCommentReport[];
};

export default function AdminCommentsPanel({
  initialReports,
}: AdminCommentsPanelProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible =
    filter === "pending"
      ? reports.filter((r) => r.status === "pending")
      : reports;

  const run = (body: Record<string, unknown>, onOk: () => void) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => ({}));
          const msg =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error: unknown }).error === "string"
              ? (payload as { error: string }).error
              : "Action failed.";
          setError(msg);
          return;
        }
        onOk();
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={filter === "pending" ? "primary" : "secondary"}
          onClick={() => setFilter("pending")}
        >
          Pending ({reports.filter((r) => r.status === "pending").length})
        </Button>
        <Button
          type="button"
          variant={filter === "all" ? "primary" : "secondary"}
          onClick={() => setFilter("all")}
        >
          All ({reports.length})
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {visible.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-subtle">No reports in this view.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((report) => (
            <li key={report.id}>
              <Card className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold uppercase">
                    {report.status}
                  </span>
                  <span>{report.reason}</span>
                  <span>·</span>
                  <span>{report.comment.page_label}</span>
                  <span>·</span>
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-ink">
                  <span className="font-semibold">
                    {report.comment.author_name ?? "Someone"}:
                  </span>{" "}
                  {report.comment.body}
                </p>
                {!report.comment.is_visible ? (
                  <p className="text-xs font-medium text-danger">
                    Comment already hidden
                  </p>
                ) : null}
                {report.details ? (
                  <p className="text-xs text-ink-muted">
                    Reporter note: {report.details}
                  </p>
                ) : null}
                <p className="text-xs text-ink-subtle">
                  Reported by {report.reporter_name ?? "Someone"}
                </p>
                {report.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(
                          {
                            action: "delete_comment",
                            commentId: report.comment.id,
                            reportId: report.id,
                          },
                          () =>
                            setReports((prev) =>
                              prev.map((r) =>
                                r.id === report.id
                                  ? {
                                      ...r,
                                      status: "resolved",
                                      comment: {
                                        ...r.comment,
                                        is_visible: false,
                                      },
                                    }
                                  : r.comment.id === report.comment.id
                                    ? {
                                        ...r,
                                        status:
                                          r.status === "pending"
                                            ? "resolved"
                                            : r.status,
                                        comment: {
                                          ...r.comment,
                                          is_visible: false,
                                        },
                                      }
                                    : r,
                              ),
                            ),
                        )
                      }
                    >
                      Delete comment
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() =>
                        run({ action: "dismiss", reportId: report.id }, () =>
                          setReports((prev) =>
                            prev.map((r) =>
                              r.id === report.id
                                ? { ...r, status: "dismissed" }
                                : r,
                            ),
                          ),
                        )
                      }
                    >
                      Dismiss report
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
