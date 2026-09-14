import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type RadioPageProps = {
  params: Promise<{ locale: string }>;
};

const EXTERNAL_LINK_CLASS = "font-semibold text-brand-strong underline";

/**
 * Other Myanmar FM stations do not offer a public embeddable stream — only
 * Padamyar FM is listed on TuneIn, whose embed player is designed for exactly
 * this (any public station, no station-owner account needed). For the rest,
 * linking to their own official site/page is more honest than faking a
 * player around a URL that might not even be a real stream.
 */
const OTHER_STATIONS = [
  {
    name: "Shwe FM",
    nameMy: "Shwe FM",
    url: "https://shwefmradio.net",
  },
  {
    name: "Cherry FM",
    nameMy: "Cherry FM",
    url: "https://cherryfmmym.com",
  },
  {
    name: "Mandalay FM",
    nameMy: "Mandalay FM",
    url: "https://www.facebook.com/MandalayFmRadioStation/",
  },
];

export default async function RadioPage({ params }: RadioPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader
          title={isMy ? "မြန်မာ FM ရေဒီယို" : "Myanmar Radio"}
          subtitle={
            isMy
              ? "ပိတ်ရက်၊ အလုပ်လုပ်နေချိန် နားထောင်လို့ကောင်းတဲ့ မြန်မာ FM ဘူတာများ။"
              : "Myanmar FM stations to listen to on your day off or while you work."
          }
        />

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">Padamyar FM</h3>
          <p className="text-sm text-ink-muted">
            {isMy
              ? "News, education နှင့် ဖျော်ဖြေရေး အစီအစဉ်များ — Live"
              : "News, education and entertainment programming — Live"}
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src="https://tunein.com/embed/player/s260714/"
              title="Padamyar FM live stream"
              width="100%"
              height="100"
              scrolling="no"
              frameBorder="0"
              allow="autoplay"
              className="block w-full"
            />
          </div>
          <p className="text-xs text-ink-subtle">
            {isMy ? "TuneIn မှတစ်ဆင့် ပေးဆောင်ထားသည်" : "Powered by TuneIn"}
          </p>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">
            {isMy ? "အခြား ဘူတာများ" : "Other stations"}
          </h3>
          <p className="text-sm text-ink-muted">
            {isMy
              ? "ဒီဘူတာများက ကိုယ်ပိုင် website/Facebook page ပေါ်မှာသာ တိုက်ရိုက် ထုတ်လွှင့်ပါတယ် — အောက်က link ကနေ ဆက်သွားနိုင်ပါတယ်။"
              : "These stations stream on their own site or Facebook page — follow the link to listen there."}
          </p>
          <ul className="space-y-2">
            {OTHER_STATIONS.map((station) => (
              <li
                key={station.name}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-muted p-3"
              >
                <span className="text-sm font-medium text-ink">
                  {isMy ? station.nameMy : station.name}
                </span>
                <a
                  href={station.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {isMy ? "နားထောင်ရန်" : "Listen"}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </PageCard>
  );
}
