import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Expense Tracker",
    short_name: "Expense Tracker",
    description: "Track your expenses and manage your budget",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0F1A",
    theme_color: "#10b981",
    icons: [
      { src: "/favicon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
