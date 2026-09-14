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
 * Stations with a real, stable audio stream, playable directly with a plain
 * <audio> element. Each URL is the station's own broadcast infrastructure
 * (found by resolving where a station directory's redirect actually lands),
 * not a scraped page or a third party's proxy — the same URL the station's
 * own site would point a player at.
 */
const LIVE_STATIONS = [
  {
    name: "Padamyar FM",
    descEn: "News, education and entertainment programming",
    descMy: "News, education နှင့် ဖျော်ဖြေရေး အစီအစဉ်များ",
    kind: "tunein" as const,
    embedUrl: "https://tunein.com/embed/player/s260714/",
  },
  {
    name: "Cherry FM",
    descEn: "Music, news and talk from Yangon",
    descMy: "ရန်ကုန်မှ သီချင်း၊ သတင်းနှင့် ဆွေးနွေးမှု အစီအစဉ်များ",
    kind: "audio" as const,
    streamUrl: "https://cherry.akiyaresearch.com:444/stream/89/;",
  },
  {
    name: "Star FM 90.3",
    descEn: "Music and entertainment from Yangon",
    descMy: "ရန်ကုန်မှ သီချင်းနှင့် ဖျော်ဖြေရေး အစီအစဉ်များ",
    kind: "audio" as const,
    streamUrl: "https://cast3.my-control-panel.com/proxy/starfmky/stream",
  },
];

/**
 * Stations known to broadcast, but with no public stream to point a player
 * at — only their own site or Facebook page. Linking out is more honest
 * than guessing at a URL that might not even be a real stream.
 */
const OTHER_STATIONS = [
  {
    name: "Shwe FM",
    url: "https://shwefmradio.net",
  },
  {
    name: "Mandalay FM",
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

        {LIVE_STATIONS.map((station) => (
          <Card key={station.name} className="space-y-3">
            <h3 className="font-semibold text-ink">{station.name}</h3>
            <p className="text-sm text-ink-muted">
              {isMy ? station.descMy : station.descEn}
            </p>
            {station.kind === "tunein" ? (
              <>
                <div className="overflow-hidden rounded-xl border border-border">
                  <iframe
                    src={station.embedUrl}
                    title={`${station.name} live stream`}
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
              </>
            ) : (
              <audio controls preload="none" className="w-full">
                <source src={station.streamUrl} />
              </audio>
            )}
          </Card>
        ))}

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
                <span className="text-sm font-medium text-ink">{station.name}</span>
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
