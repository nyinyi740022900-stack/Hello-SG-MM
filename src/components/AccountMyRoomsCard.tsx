"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";
import {
  formatPriceSgd,
  formatListingExpiry,
  type RoomListingRow,
  type RoomListingStatus,
} from "@/lib/roomListings";
import type { AppLocale } from "@/i18n/routing";

type AccountMyRoomsCardProps = {
  locale: AppLocale;
  rooms: RoomListingRow[];
};

const STATUS_KEY: Record<RoomListingStatus, string> = {
  pending: "roomStatusPending",
  published: "roomStatusPublished",
  rejected: "roomStatusRejected",
  expired: "roomStatusExpired",
};

export default function AccountMyRoomsCard({
  locale,
  rooms,
}: AccountMyRoomsCardProps) {
  const t = useTranslations("account");

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">{t("myRoomsTitle")}</h2>
          <p className="text-sm text-ink-muted">{t("myRoomsHint")}</p>
        </div>
        <LinkButton href="/housing/post" locale={locale} size="sm">
          {t("postRoom")}
        </LinkButton>
      </div>

      {rooms.length === 0 ? (
        <StatusMessage variant="info">{t("myRoomsEmpty")}</StatusMessage>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => {
            const price = formatPriceSgd(Number(room.price_sgd), locale);
            const statusLabel = t(STATUS_KEY[room.status]);
            const expiry =
              room.status === "published"
                ? formatListingExpiry(room.expires_at, locale)
                : null;
            return (
              <li
                key={room.id}
                className="rounded-xl border border-border bg-surface-muted p-3 space-y-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {room.status === "published" ? (
                      <Link
                        href={`/housing/${room.id}`}
                        locale={locale}
                        className="font-semibold text-brand-strong underline"
                      >
                        {room.title}
                      </Link>
                    ) : (
                      <p className="font-semibold text-ink">{room.title}</p>
                    )}
                    <p className="text-xs text-ink-subtle">
                      {room.area} · {price} · {statusLabel}
                      {expiry ? ` · ${t("expiresOn", { date: expiry })}` : ""}
                    </p>
                  </div>
                  <Link
                    href="/housing"
                    locale={locale}
                    className="text-xs font-medium text-brand-strong underline"
                  >
                    {t("browseHousing")}
                  </Link>
                </div>
                {room.status === "rejected" && room.admin_note ? (
                  <p className="text-xs text-danger">
                    {t("roomRejectNote")}: {room.admin_note}
                  </p>
                ) : null}
                {room.status === "pending" ? (
                  <p className="text-xs text-ink-subtle">{t("roomPendingNote")}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
