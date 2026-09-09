/**
 * Public transport in Singapore, distilled to the decisions people make while
 * standing at a gate or bus stop.
 */
export const MAP_LINKS = [
  {
    id: "planner",
    href: "https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/plan_your_journey.html",
  },
  {
    id: "fare",
    href: "https://www.lta.gov.sg/content/ltagov/en/map/fare-calculator.html",
  },
  {
    id: "network",
    href: "https://www.lta.gov.sg/content/ltaweb/en/public-transport/mrt-and-lrt-trains/train-system-map.html",
  },
  { id: "myTransportAndroid", href: "https://play.google.com/store/apps/details?id=sg.gov.lta.mytransportsg" },
  { id: "myTransportIos", href: "https://apps.apple.com/sg/app/mytransport-sg/id1306661188" },
  { id: "simplyGo", href: "https://www.simplygo.com.sg/" },
  { id: "smrt", href: "https://www.smrt.com.sg/trains/" },
  { id: "sbst", href: "https://www.sbstransit.com.sg/Service/TrainService" },
] as const;

export const QUICK_START_KEYS = ["openPlanner", "checkLastTrain", "choosePayment", "saveStops", "leaveBuffer"] as const;
export const PAY_KEYS = ["payCard", "payBank", "payBalance"] as const;
export const TAP_KEYS = ["tapIn", "tapOut", "busDoor"] as const;
export const TRANSFER_KEYS = ["transferTime", "transferSameBus", "transferStations"] as const;
export const NIGHT_KEYS = ["night1", "night2", "night3"] as const;
export const MISTAKE_KEYS = ["mistake1", "mistake2", "mistake3", "mistake4", "mistake5"] as const;

export const HUB_MAPS = [
  {
    id: "peninsula",
    href: "https://www.google.com/maps/search/?api=1&query=Peninsula+Plaza+Singapore",
  },
  {
    id: "mustafa",
    href: "https://www.google.com/maps/search/?api=1&query=Mustafa+Centre+Singapore",
  },
  {
    id: "tekka",
    href: "https://www.google.com/maps/search/?api=1&query=Tekka+Centre+Singapore",
  },
  {
    id: "mom",
    href: "https://www.google.com/maps/search/?api=1&query=MOM+Services+Centre+1500+Bendemeer+Road+Singapore+339946",
  },
  {
    id: "airport",
    href: "https://www.google.com/maps/search/?api=1&query=Changi+Airport+MRT+Station",
  },
] as const;
