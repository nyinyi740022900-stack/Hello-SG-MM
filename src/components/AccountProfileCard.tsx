"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUserProfile, type UserProfileRole } from "@/lib/payments";
import StatusMessage from "@/components/ui/StatusMessage";

function roleClass(role: UserProfileRole | null) {
  if (role === "admin") return "border-accent-border bg-accent-soft text-accent";
  if (role === "agency") return "border-warning-border bg-warning-soft text-warning";
  return "border-border bg-surface-muted text-ink-muted";
}

export default function AccountProfileCard() {
  const { user, isLoading } = useAuth();
  const [role, setRole] = useState<UserProfileRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadRole = async () => {
      if (!user) {
        queueMicrotask(() => setRole(null));
        return;
      }
      setIsRoleLoading(true);
      const { data } = await fetchUserProfile(user.id);
      if (!mounted) return;
      const metadataRole =
        typeof user.user_metadata?.role === "string"
          ? (user.user_metadata.role as UserProfileRole)
          : null;
      setRole(data?.role ?? metadataRole ?? "user");
      setIsRoleLoading(false);
    };
    void loadRole();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (isLoading) {
    return <StatusMessage variant="loading">Loading profile...</StatusMessage>;
  }

  if (!user) {
    return <StatusMessage variant="warning">Please login to view your profile.</StatusMessage>;
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-ink">Profile</h3>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${roleClass(role)}`}>
          {isRoleLoading ? "Loading role..." : `Role: ${(role ?? "user").toUpperCase()}`}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs text-ink-subtle">Email</p>
          <p className="mt-1 text-sm font-medium text-ink break-all">{user.email}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs text-ink-subtle">User ID</p>
          <p className="mt-1 text-sm font-mono text-ink-muted">{user.id.slice(0, 8)}...</p>
        </div>
      </div>
    </section>
  );
}
