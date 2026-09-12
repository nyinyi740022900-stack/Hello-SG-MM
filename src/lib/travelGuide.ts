/**
 * Travel guides from Singapore — nearby destinations for rest-day / short leave.
 * Copy lives in messages under travel.*; URLs, photos and section order live here.
 *
 * Photos are stored under public/travel/ (Creative Commons). Credits must be
 * shown wherever an image is rendered.
 */

import fs from "fs";
import path from "path";

export const DESTINATION_IDS = [
  "jb",
  "melaka",
  "batam",
  "bintan",
  "bangkok",
  "phuket",
] as const;

export type TravelDestinationId = (typeof DESTINATION_IDS)[number];

export type PhotoCredit = {
  author: string;
  license: string;
  source: string;
};

export type TravelPhoto = {
  /** Filename under public/travel/ */
  file: string;
  credit: PhotoCredit;
  /** i18n key under travel.photos.<id> — optional caption */
  captionKey?: string;
};

export const PREP_KEYS = [
  "leaveOk",
  "passportValid",
  "workPass",
  "money",
  "sim",
  "returnPlan",
  "powerBank",
  "emergencyContact",
  "hotelOrReturn",
] as const;

export const PREP_MISTAKE_KEYS = [
  "noLeave",
  "passportShort",
  "cashOnly",
  "noReturnTicket",
  "fakeAgent",
  "noHotelApp",
] as const;

/** Government / policy links only — never replace with affiliate URLs. */
export const HUB_GOVERNMENT_LINKS = [
  { id: "ica", href: "https://www.ica.gov.sg/" },
  {
    id: "momLeave",
    href: "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker/sector-specific-rules",
  },
] as const;

/** @deprecated Use HUB_GOVERNMENT_LINKS + TRAVEL_PRODUCT_LINK_KEYS */
export const HUB_OFFICIAL_LINKS = HUB_GOVERNMENT_LINKS;

/**
 * Booking apps — open homepage / app store when no admin affiliate is set.
 * Prefer Admin → Referrals placement `travel` for Agoda / Trip.com invitation
 * or affiliate URLs (income). Destination pages also deep-link city search.
 */
export const BOOKING_APP_LINKS = [
  { id: "agoda", href: "https://www.agoda.com/" },
  { id: "trip", href: "https://www.trip.com/" },
  {
    id: "agodaApp",
    href: "https://www.agoda.com/app/",
  },
  {
    id: "tripApp",
    href: "https://www.trip.com/trip-app/",
  },
] as const;

type DestMeta = {
  id: TravelDestinationId;
  countryCode: "MY" | "ID" | "TH";
  needKeys: readonly string[];
  howKeys: readonly string[];
  placeKeys: readonly string[];
  foodKeys: readonly string[];
  tipKeys: readonly string[];
  mistakeKeys: readonly string[];
  budgetKeys: readonly string[];
  maps: readonly { id: string; href: string }[];
  official: readonly { id: string; href: string }[];
  /** City search / listing pages (non-affiliate fallbacks). */
  booking: readonly { id: "agoda" | "trip"; href: string }[];
  photos: readonly TravelPhoto[];
};

export const DESTINATIONS: Record<TravelDestinationId, DestMeta> = {
  jb: {
    id: "jb",
    countryCode: "MY",
    needKeys: [
      "passport",
      "passCard",
      "leave",
      "cashSgdMyr",
      "returnSameDay",
      "phoneData",
      "powerBank",
      "emergencyContact",
    ],
    howKeys: ["causeway", "tuas", "busQueen", "grabTaxi"],
    placeKeys: ["jbCity", "legacy", "ksl", "bukitChagar"],
    foodKeys: ["seafood", "hawker", "coffee"],
    tipKeys: ["peakQueue", "keepSgd", "exchangeBoard", "bookHotelApp"],
    mistakeKeys: ["noPassport", "missLastBus", "overspend"],
    budgetKeys: ["transport", "food", "shopping", "dayTotal"],
    maps: [
      {
        id: "woodlands",
        href: "https://www.google.com/maps/search/?api=1&query=Woodlands+Checkpoint+Singapore",
      },
      {
        id: "larkin",
        href: "https://www.google.com/maps/search/?api=1&query=Larkin+Sentral+Johor+Bahru",
      },
      {
        id: "ksl",
        href: "https://www.google.com/maps/search/?api=1&query=KSL+City+Mall+Johor+Bahru",
      },
    ],
    official: [
      { id: "malaysiaEntry", href: "https://www.malaysia.gov.my/" },
      { id: "causewayLink", href: "https://www.causewaylink.com.sg/" },
    ],
    booking: [
      {
        id: "agoda",
        href: "https://www.agoda.com/city/johor-bahru-my.html",
      },
      {
        id: "trip",
        href: "https://www.trip.com/hotels/johor-bahru-hotel-list-217/",
      },
    ],
    photos: [
      {
        file: "jb.jpg",
        captionKey: "jbSkyline",
        credit: {
          author: "Samuel Goh (Flickr)",
          license: "CC BY 2.0",
          source:
            "https://commons.wikimedia.org/wiki/File:Johor_Bahru_Skyline_(17300534739).jpg",
        },
      },
      {
        file: "jb-city.jpg",
        captionKey: "jbSquare",
        credit: {
          author: "Wikimania 2023 photo walk",
          license: "CC BY-SA 3.0",
          source:
            "https://commons.wikimedia.org/wiki/File:Wikimania_2023_-_Johor_Bahru_Photo_Walk_-_JB_City_Square.jpg",
        },
      },
    ],
  },
  melaka: {
    id: "melaka",
    countryCode: "MY",
    needKeys: [
      "passport",
      "passCard",
      "leave",
      "overnightBag",
      "cash",
      "bookingApp",
      "powerBank",
      "medicine",
      "emergencyContact",
    ],
    howKeys: ["viaJb", "directBus", "hotelWalk"],
    placeKeys: ["jonker", "river", "dutchSquare", "nightMarket"],
    foodKeys: ["nyonya", "chickenRiceBall", "satay"],
    tipKeys: ["bookBus", "heat", "walkShoes", "bookHotelApp"],
    mistakeKeys: ["noHotel", "cashShort", "lateReturn"],
    budgetKeys: ["bus", "hotel", "food", "weekendTotal"],
    maps: [
      {
        id: "jonker",
        href: "https://www.google.com/maps/search/?api=1&query=Jonker+Street+Melaka",
      },
      {
        id: "dutchSquare",
        href: "https://www.google.com/maps/search/?api=1&query=Dutch+Square+Melaka",
      },
    ],
    official: [{ id: "tourismMelaka", href: "https://www.malaysia.travel/" }],
    booking: [
      { id: "agoda", href: "https://www.agoda.com/city/malacca-my.html" },
      {
        id: "trip",
        href: "https://www.trip.com/hotels/malacca-hotel-list-725/",
      },
    ],
    photos: [
      {
        file: "melaka.jpg",
        captionKey: "melakaChurch",
        credit: {
          author: "Commons contributors",
          license: "CC BY-SA 4.0",
          source:
            "https://commons.wikimedia.org/wiki/File:Christ_Church_Melaka_1753.jpg",
        },
      },
      {
        file: "melaka-jonker.jpg",
        captionKey: "melakaJonker",
        credit: {
          author: "Commons contributors",
          license: "CC BY-SA 3.0",
          source:
            "https://commons.wikimedia.org/wiki/File:Melaka_Malaysia_Geographer-Cafe-at-Jonker-Walk-01.jpg",
        },
      },
    ],
  },
  batam: {
    id: "batam",
    countryCode: "ID",
    needKeys: [
      "passport",
      "visaCheck",
      "leave",
      "ferryTicket",
      "idrCash",
      "bookingApp",
      "powerBank",
      "printedOrQr",
      "emergencyContact",
    ],
    howKeys: ["harbourFront", "tanahMerah", "ferryOperator", "taxiBatam"],
    placeKeys: ["nagoya", "beach", "outlet"],
    foodKeys: ["seafood", "indoPadang", "coffee"],
    tipKeys: ["visaFirst", "ferryTime", "keepTicket", "bookHotelApp"],
    mistakeKeys: ["noVisa", "missFerry", "agentScam"],
    budgetKeys: ["ferry", "food", "taxi", "dayTotal"],
    maps: [
      {
        id: "harbourFront",
        href: "https://www.google.com/maps/search/?api=1&query=HarbourFront+Centre+Singapore+ferry",
      },
      {
        id: "batamCentre",
        href: "https://www.google.com/maps/search/?api=1&query=Batam+Centre+Ferry+Terminal",
      },
      {
        id: "nagoya",
        href: "https://www.google.com/maps/search/?api=1&query=Nagoya+Batam",
      },
    ],
    official: [
      { id: "immigrationId", href: "https://www.imigrasi.go.id/" },
      { id: "batamFast", href: "https://www.batamfast.com/" },
    ],
    booking: [
      { id: "agoda", href: "https://www.agoda.com/city/batam-island-id.html" },
      {
        id: "trip",
        href: "https://www.trip.com/hotels/batam-hotel-list-609/",
      },
    ],
    photos: [
      {
        file: "batam.jpg",
        captionKey: "batamBridge",
        credit: {
          author: "Commons contributors",
          license: "CC BY-SA 4.0",
          source: "https://commons.wikimedia.org/wiki/File:Jembatan_Barelang.jpg",
        },
      },
    ],
  },
  bintan: {
    id: "bintan",
    countryCode: "ID",
    needKeys: [
      "passport",
      "visaCheck",
      "leave",
      "ferryResort",
      "budgetHotel",
      "bookingApp",
      "sunCare",
      "powerBank",
      "emergencyContact",
    ],
    howKeys: ["tanahMerah", "bandarBentan", "resortTransfer"],
    placeKeys: ["lagoi", "beach", "mangrove"],
    foodKeys: ["seafood", "resortBuffet", "localWarung"],
    tipKeys: ["weekendPrice", "sunCream", "returnFerry", "bookHotelApp"],
    mistakeKeys: ["noVisa", "underBudget", "missLastFerry"],
    budgetKeys: ["ferry", "stay", "food", "weekendTotal"],
    maps: [
      {
        id: "tanahMerah",
        href: "https://www.google.com/maps/search/?api=1&query=Tanah+Merah+Ferry+Terminal+Singapore",
      },
      {
        id: "lagoi",
        href: "https://www.google.com/maps/search/?api=1&query=Lagoi+Bay+Bintan",
      },
    ],
    official: [
      { id: "immigrationId", href: "https://www.imigrasi.go.id/" },
      { id: "bintanResorts", href: "https://www.bintan-resorts.com/" },
    ],
    booking: [
      { id: "agoda", href: "https://www.agoda.com/city/bintan-island-id.html" },
      {
        id: "trip",
        href: "https://www.trip.com/hotels/bintan-island-hotel-list-1342/",
      },
    ],
    photos: [
      {
        file: "bintan.jpg",
        captionKey: "bintanBeach",
        credit: {
          author: "Commons contributors",
          license: "CC BY 2.0",
          source:
            "https://commons.wikimedia.org/wiki/File:Bintan_Agro_Beach_Resort2.jpg",
        },
      },
    ],
  },
  bangkok: {
    id: "bangkok",
    countryCode: "TH",
    needKeys: [
      "passport",
      "visaCheck",
      "leaveDays",
      "flight",
      "thbOrCard",
      "bookingApp",
      "esimPlan",
      "powerBank",
      "hotelConfirm",
      "emergencyContact",
    ],
    howKeys: ["budgetFlight", "airportTrain", "btsMrt", "grab"],
    placeKeys: ["grandPalace", "chatuchak", "chaoPhraya", "iconSiam"],
    foodKeys: ["streetFood", "boatNoodle", "mangoSticky"],
    tipKeys: ["visaStamp", "esim", "watchBag", "bookHotelApp"],
    mistakeKeys: ["noVisa", "taxiScam", "passportCopy"],
    budgetKeys: ["flight", "hotel", "food", "threeDay"],
    maps: [
      {
        id: "suvarnabhumi",
        href: "https://www.google.com/maps/search/?api=1&query=Suvarnabhumi+Airport+Bangkok",
      },
      {
        id: "grandPalace",
        href: "https://www.google.com/maps/search/?api=1&query=Grand+Palace+Bangkok",
      },
      {
        id: "chatuchak",
        href: "https://www.google.com/maps/search/?api=1&query=Chatuchak+Weekend+Market+Bangkok",
      },
    ],
    official: [
      { id: "thaiImmigration", href: "https://www.immigration.go.th/" },
      { id: "tat", href: "https://www.tourismthailand.org/" },
    ],
    booking: [
      { id: "agoda", href: "https://www.agoda.com/city/bangkok-th.html" },
      {
        id: "trip",
        href: "https://www.trip.com/hotels/bangkok-hotel-list-359/",
      },
    ],
    photos: [
      {
        file: "bangkok.jpg",
        captionKey: "bangkokWatArun",
        credit: {
          author: "Diego Delso",
          license: "CC BY-SA 3.0",
          source:
            "https://commons.wikimedia.org/wiki/File:Templo_Wat_Arun,_Bangkok,_Tailandia,_2013-08-22,_DD_30.jpg",
        },
      },
      {
        file: "bangkok-palace.jpg",
        captionKey: "bangkokPalace",
        credit: {
          author: "Commons contributors",
          license: "CC BY-SA 4.0",
          source:
            "https://commons.wikimedia.org/wiki/File:A_roof_of_a_building_at_the_Grand_Palace,_Bangkok,_sunrise,_2017.jpg",
        },
      },
    ],
  },
  phuket: {
    id: "phuket",
    countryCode: "TH",
    needKeys: [
      "passport",
      "visaCheck",
      "leaveDays",
      "flight",
      "beachBudget",
      "bookingApp",
      "sunCare",
      "esimPlan",
      "powerBank",
      "emergencyContact",
    ],
    howKeys: ["directFlight", "airportTaxi", "songthaew"],
    placeKeys: ["patong", "oldTown", "promthep", "islandTrip"],
    foodKeys: ["seafood", "padThai", "cafe"],
    tipKeys: ["sun", "bargain", "esim", "bookHotelApp"],
    mistakeKeys: ["noVisa", "jetSkiScam", "cashOnBeach"],
    budgetKeys: ["flight", "hotel", "food", "threeDay"],
    maps: [
      {
        id: "phuketAirport",
        href: "https://www.google.com/maps/search/?api=1&query=Phuket+International+Airport",
      },
      {
        id: "oldTown",
        href: "https://www.google.com/maps/search/?api=1&query=Phuket+Old+Town",
      },
      {
        id: "patong",
        href: "https://www.google.com/maps/search/?api=1&query=Patong+Beach+Phuket",
      },
    ],
    official: [
      { id: "thaiImmigration", href: "https://www.immigration.go.th/" },
      { id: "tat", href: "https://www.tourismthailand.org/" },
    ],
    booking: [
      { id: "agoda", href: "https://www.agoda.com/city/phuket-th.html" },
      {
        id: "trip",
        href: "https://www.trip.com/hotels/phuket-hotel-list-187/",
      },
    ],
    photos: [
      {
        file: "phuket.jpg",
        captionKey: "phuketPatong",
        credit: {
          author: "Commons contributors",
          license: "CC BY-SA 4.0",
          source:
            "https://commons.wikimedia.org/wiki/File:Patong_Beach_Phuket_November_2012.jpg",
        },
      },
      {
        file: "phuket-oldtown.jpg",
        captionKey: "phuketOldTown",
        credit: {
          author: "Commons contributors",
          license: "CC0",
          source:
            "https://commons.wikimedia.org/wiki/File:Phuket_old_town_(52549766215).jpg",
        },
      },
    ],
  },
};

const TRAVEL_DIR = path.join(process.cwd(), "public", "travel");

/** Resolve photos that exist on disk (skips missing files safely). */
export function getDestinationPhotos(
  id: TravelDestinationId,
): Array<TravelPhoto & { src: string }> {
  const result: Array<TravelPhoto & { src: string }> = [];
  for (const photo of DESTINATIONS[id].photos) {
    try {
      if (fs.existsSync(path.join(TRAVEL_DIR, photo.file))) {
        result.push({ ...photo, src: `/travel/${photo.file}` });
      }
    } catch {
      // ignore
    }
  }
  return result;
}

/** Hero photo for hub destination cards. */
export function getDestinationHero(
  id: TravelDestinationId,
): (TravelPhoto & { src: string }) | null {
  const photos = getDestinationPhotos(id);
  return photos[0] ?? null;
}

export function isTravelDestinationId(value: string): value is TravelDestinationId {
  return (DESTINATION_IDS as readonly string[]).includes(value);
}
