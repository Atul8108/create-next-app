export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  fbPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? "",
} as const;
