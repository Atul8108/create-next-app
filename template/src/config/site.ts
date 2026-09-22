import { env } from "./env";

export const siteConfig = {
  name: "__PROJECT_TITLE__",
  description: "A production-ready Next.js starter with an enforced feature-based architecture.",
  url: env.siteUrl,
} as const;
