import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hello SG — News & Everyday Help for Singapore",
    short_name: "Hello SG",
    description:
      "Bilingual (English/Myanmar) news, weather, remittance rates, guides and practical tools for anyone living in Singapore.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef2f9",
    theme_color: "#0f6e5c",
    icons: [
      { src: "/icon/32", sizes: "32x32", type: "image/png" },
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
