"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/** Lets a job's poster delist it — the counterpart to AccountMyRoomsCard's delete. */
export default function JobListingDeleteButton({ jobId }: { jobId: string }) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/job-listings?id=${jobId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={isDeleting}
      className="text-xs font-medium text-ink-subtle underline hover:text-danger disabled:opacity-60"
    >
      {t("delete")}
    </button>
  );
}
