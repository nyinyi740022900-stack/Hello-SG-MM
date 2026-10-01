"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUserProfile, type UserProfileRole } from "@/lib/payments";
import { fetchAllUsers, type UserProfileRow } from "@/lib/users";
import StatusMessage from "@/components/ui/StatusMessage";

type RoleFilter = "all" | "user" | "agency" | "admin";

/** Format an ISO timestamp to a human-readable local date string. */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function RoleBadge({ role }: { role: UserProfileRow["role"] }) {
  const config: Record<UserProfileRow["role"], { label: string; cls: string }> = {
    admin: { label: "Admin", cls: "bg-accent-soft text-accent" },
    agency: { label: "Agency", cls: "bg-brand-soft text-brand-strong" },
    user: { label: "User", cls: "bg-surface-muted text-ink-muted" },
  };
  const { label, cls } = config[role];
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminUsersPanel() {
  const { user, isLoading, isConfigured } = useAuth();
  const [users, setUsers] = useState<UserProfileRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [profileRole, setProfileRole] = useState<UserProfileRole | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const isAdmin = profileRole === "admin";

  useEffect(() => {
    if (!isConfigured || !user) {
      queueMicrotask(() => setIsLoadingProfile(false));
      return;
    }

    let isMounted = true;
    const loadProfile = async () => {
      const { data } = await fetchUserProfile(user.id);
      if (isMounted) {
        setProfileRole(data?.role ?? null);
        setIsLoadingProfile(false);
      }
    };
    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isConfigured, user]);

  const loadUsers = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    const { data, error } = await fetchAllUsers();
    if (error) {
      setLoadError(error);
      setUsers(null);
    } else {
      setUsers(data);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!isConfigured || !user || !isAdmin || isLoadingProfile) return;
    const timer = setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isConfigured, user, isLoadingProfile]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.display_name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const base = { all: 0, user: 0, agency: 0, admin: 0 };
    for (const u of users ?? []) {
      base.all += 1;
      base[u.role] += 1;
    }
    return base;
  }, [users]);

  if (!isConfigured) {
    return (
      <StatusMessage variant="error">
        Supabase is not configured. / Supabase သတ်မှတ်မထားပါ။
      </StatusMessage>
    );
  }

  if (isLoading || isLoadingProfile) {
    return (
      <StatusMessage variant="loading">
        Checking session… / Session စစ်ဆေးနေသည်…
      </StatusMessage>
    );
  }

  if (!user) {
    return (
      <StatusMessage variant="warning">
        You must be logged in to access this panel. / ဤ panel ကို ဝင်ရောက်ရန် အကောင့်ဝင်ပါ။
      </StatusMessage>
    );
  }

  if (!isAdmin) {
    return (
      <StatusMessage variant="warning">
        Admin access required. / Admin ခွင့်ပြုချက် လိုသည်။
      </StatusMessage>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs">
          {(["all", "user", "agency", "admin"] as RoleFilter[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={[
                "rounded-full px-3 py-1 font-medium transition-colors",
                roleFilter === r
                  ? "bg-brand text-ink-on-brand"
                  : "bg-surface-muted text-ink-muted hover:bg-border",
              ].join(" ")}
            >
              {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)} (
              {counts[r]})
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => void loadUsers()}
          className={[
            "rounded border px-3 py-1 text-xs font-medium transition-colors",
            isRefreshing
              ? "cursor-not-allowed border-border bg-surface-muted text-ink-subtle"
              : "border-border-strong bg-surface text-ink-muted hover:bg-surface-muted",
          ].join(" ")}
        >
          {isRefreshing ? "Refreshing…" : "↺ Refresh / ပြန်ဆွဲရန်"}
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or name… / email သို့မဟုတ် အမည်ဖြင့် ရှာပါ…"
        className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle"
      />

      {loadError ? <StatusMessage variant="error">{loadError}</StatusMessage> : null}

      {isRefreshing && !users ? (
        <StatusMessage variant="loading">
          Loading users… / Users data ရယူနေသည်…
        </StatusMessage>
      ) : null}

      {users ? (
        filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong bg-surface-muted py-6 text-center">
            <p className="text-sm font-medium text-ink-muted">
              No users match this filter. / ဒီစစ်ထုတ်မှုနှင့် ကိုက်ညီသူ မရှိပါ။
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-ink-subtle">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="bg-surface">
                    <td className="break-all px-3 py-2 text-ink">{u.email}</td>
                    <td className="px-3 py-2 text-ink-muted">
                      {u.display_name ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-3 py-2 text-ink-subtle">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}
