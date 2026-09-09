import fs from "fs";
import path from "path";
import type { CountryCode } from "@/lib/countries";

/**
 * Places to spend a rest day.
 *
 * Two kinds, kept apart because they answer different questions. A community
 * hub is where your own people gather — you go to hear your language, eat food
 * from home, send money, and not feel foreign for an afternoon. A place to
 * visit is somewhere in Singapore worth seeing on the one free day you get,
 * regardless of where you are from.
 *
 * `cost` is the field that earns its place. Most guides to Singapore quietly
 * assume the reader has money and a passport that opens doors; ours is read by
 * someone deciding whether a trip is worth a day's wages. "Free" here means
 * free for a Work Permit holder specifically — not "free for citizens", which
 * is a different and much longer list.
 */
export type PlaceCost = "free" | "mixed" | "paid";

export type OffDayPlace = {
  key: string;
  section: "community" | "visit";
  /** Empty means the place is not tied to any one community. */
  countries: CountryCode[];
  address: string;
  mapsQuery: string;
  cost: PlaceCost;
  /** Official page, where one exists, so opening hours can be checked. */
  officialUrl?: string;
};

export const OFF_DAY_PLACES: OffDayPlace[] = [
  // ---- Community hubs -----------------------------------------------------
  {
    key: "peninsulaPlaza",
    section: "community",
    countries: ["mm"],
    address: "111 North Bridge Road, Singapore 179098",
    mapsQuery: "Peninsula Plaza Singapore",
    cost: "free",
  },
  {
    key: "burmeseTemple",
    section: "community",
    countries: ["mm"],
    address: "14 Tai Gin Road, Singapore 327873",
    mapsQuery: "Burmese Buddhist Temple Singapore",
    cost: "free",
  },
  {
    key: "farrerPark",
    section: "community",
    countries: ["mm"],
    address: "Stamford Road / Farrer Park / Little India area",
    mapsQuery: "Farrer Park MRT Singapore",
    cost: "free",
  },
  {
    key: "tekkaCentre",
    section: "community",
    countries: ["in", "bd"],
    address: "665 Buffalo Road, Singapore 210665 — at Little India MRT (NE7 / DT12)",
    mapsQuery: "Tekka Centre Singapore",
    cost: "free",
  },
  {
    key: "bangladeshSquare",
    section: "community",
    countries: ["bd"],
    address: "Desker Road at Lembu Road, Little India — nearest MRT Farrer Park (NE8)",
    mapsQuery: "Desker Road Lembu Road Singapore",
    cost: "free",
  },
  {
    key: "mustafa",
    section: "community",
    countries: ["in", "bd"],
    address: "145 Syed Alwi Road, Singapore 207704 — nearest MRT Farrer Park (NE8)",
    mapsQuery: "Mustafa Centre Singapore",
    cost: "free",
  },
  {
    key: "peoplesPark",
    section: "community",
    countries: ["cn"],
    address: "1 Park Road, Singapore 059108 — at Chinatown MRT (NE4 / DT19)",
    mapsQuery: "People's Park Complex Singapore",
    cost: "free",
  },

  // ---- Worth seeing, and free ---------------------------------------------
  // Every "free" below was checked against the operator's own site, because
  // "free in Singapore" very often means "free if you hold a pink or blue IC".
  {
    key: "gardensByTheBay",
    section: "visit",
    countries: [],
    address: "18 Marina Gardens Drive, Singapore 018953 — Bayfront MRT (CE1 / DT16)",
    mapsQuery: "Gardens by the Bay Singapore",
    cost: "mixed",
    officialUrl: "https://www.gardensbythebay.com.sg/en/plan-your-visit/hours-admission.html",
  },
  {
    key: "botanicGardens",
    section: "visit",
    countries: [],
    address: "1 Cluny Road, Singapore 259569 — Botanic Gardens MRT (CC19 / DT9)",
    mapsQuery: "Singapore Botanic Gardens",
    cost: "mixed",
    officialUrl: "https://sbg.nparks.gov.sg/visit/general-info/",
  },
  {
    key: "marinaBarrage",
    section: "visit",
    countries: [],
    address: "8 Marina Gardens Drive, Singapore 018951 — Gardens by the Bay, then walk",
    mapsQuery: "Marina Barrage Singapore",
    cost: "free",
    officialUrl: "https://www.pub.gov.sg/Public/Places-of-Interest/Marina-Barrage/Visitors-Information",
  },
  {
    key: "jewelChangi",
    section: "visit",
    countries: [],
    address: "78 Airport Boulevard, Singapore 819666 — Changi Airport MRT (CG2)",
    mapsQuery: "Jewel Changi Airport",
    cost: "mixed",
    officialUrl: "https://www.jewelchangiairport.com/en/attractions/rain-vortex.html",
  },
];

/**
 * Optional photo for a place, read from `public/places/`.
 *
 * Same approach as the category artwork: a file that exists is used, one that
 * does not falls back to no image at all, so the page works before any photo
 * has been added and does not break if one is removed. Photos must be either
 * our own or properly licensed — this app deliberately carries no hot-linked
 * third-party imagery.
 */
const PLACE_DIR = path.join(process.cwd(), "public", "places");
const EXTENSIONS = [".webp", ".jpg", ".png"];

let cachedPhotos: Record<string, string> | null = null;

export function getPlacePhotos(): Record<string, string> {
  if (cachedPhotos) return cachedPhotos;

  const map: Record<string, string> = {};
  for (const place of OFF_DAY_PLACES) {
    for (const ext of EXTENSIONS) {
      const filename = `${place.key}${ext}`;
      try {
        if (fs.existsSync(path.join(PLACE_DIR, filename))) {
          map[place.key] = `/places/${filename}`;
          break;
        }
      } catch {
        // A missing or unreadable directory is not worth failing a render over.
      }
    }
  }

  cachedPhotos = map;
  return map;
}
