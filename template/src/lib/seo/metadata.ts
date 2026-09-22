import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface BuildMetadataParams {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "",
  image,
}: BuildMetadataParams): Metadata {
  const url = `${siteConfig.url}${path}`;
  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
