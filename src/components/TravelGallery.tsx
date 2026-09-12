import Image from "next/image";
import type { TravelPhoto } from "@/lib/travelGuide";

type TravelGalleryProps = {
  photos: Array<TravelPhoto & { src: string }>;
  captionFor: (key: string) => string;
  creditLabel: string;
};

/**
 * Destination photo strip with required Creative Commons attribution.
 */
export default function TravelGallery({
  photos,
  captionFor,
  creditLabel,
}: TravelGalleryProps) {
  if (photos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {photos.map((photo) => (
          <figure
            key={photo.file}
            className="overflow-hidden rounded-2xl border border-border bg-surface-muted"
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={photo.src}
                alt={photo.captionKey ? captionFor(photo.captionKey) : photo.file}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
                priority={photo === photos[0]}
              />
            </div>
            <figcaption className="space-y-0.5 px-3 py-2">
              {photo.captionKey ? (
                <p className="text-sm font-medium text-ink">
                  {captionFor(photo.captionKey)}
                </p>
              ) : null}
              <p className="text-xs text-ink-subtle">
                {creditLabel}: {photo.credit.author} · {photo.credit.license} ·{" "}
                <a
                  href={photo.credit.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  source
                </a>
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
