/**
 * Burmese labels for NEA's forecast vocabulary.
 *
 * NEA's `general.forecast` field is a small, long-stable set of English
 * phrases (the same set used across their 2-hour, 24-hour and PM2.5 forecast
 * APIs) — not free text. It was being rendered straight through with no
 * translation at all, so a Burmese reader saw "Thundery Showers" on an
 * otherwise fully-Burmese page.
 *
 * There is no documented enum to import, so this list was built from NEA's
 * known standard vocabulary. Anything not in it falls back to the original
 * English string rather than showing nothing — a missed translation is a
 * smaller loss than a blank weather line, and matches how every other
 * partially-translated surface in this app degrades.
 */
const FORECAST_MY: Record<string, string> = {
  Fair: "သာယာမည်",
  "Fair (Day)": "သာယာမည် (နေ့)",
  "Fair (Night)": "သာယာမည် (ညဉ့်)",
  "Fair and Warm": "သာယာပူနွေးမည်",
  "Partly Cloudy": "တိမ်တိုက်တစိတ်တပိုင်း",
  "Partly Cloudy (Day)": "တိမ်တိုက်တစိတ်တပိုင်း (နေ့)",
  "Partly Cloudy (Night)": "တိမ်တိုက်တစိတ်တပိုင်း (ညဉ့်)",
  Cloudy: "တိမ်အုံ့မည်",
  Hazy: "မီးခိုးမှုန်မည်",
  "Slightly Hazy": "မီးခိုးမှုန် အနည်းငယ်",
  Windy: "လေပြင်းတိုက်မည်",
  Mist: "နှင်းမှုန်ကျမည်",
  Fog: "နှင်းမြူကျမည်",
  "Light Rain": "မိုးအငယ်စား ရွာမည်",
  "Moderate Rain": "မိုးအလတ်စား ရွာမည်",
  "Heavy Rain": "မိုးအကြီးစား ရွာမည်",
  "Passing Showers": "မိုးတစ်ပုတ်ချင်း ရွာမည်",
  "Light Showers": "မိုးရွာသွန်း အနည်းငယ်",
  Showers: "မိုးရွာသွန်းမည်",
  "Heavy Showers": "မိုးသည်းထန်စွာ ရွာသွန်းမည်",
  "Thundery Showers": "မိုးကြိုးပစ်၍ မိုးရွာမည်",
  "Heavy Thundery Showers": "မိုးကြိုးပစ်၍ မိုးသည်းထန်စွာ ရွာမည်",
  "Heavy Thundery Showers with Gusty Winds":
    "မိုးကြိုးပစ်၍ လေပြင်းနှင့်အတူ မိုးသည်းထန်စွာ ရွာမည်",
  Sunny: "နေပူထွက်မည်",
  Warm: "ပူနွေးမည်",
};

/** Translate NEA's forecast text for the given locale; pass through if unmapped. */
export function localizeForecast(forecast: string, locale: string): string {
  if (locale !== "my") return forecast;
  return FORECAST_MY[forecast] ?? forecast;
}
