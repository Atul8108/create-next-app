import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { siteConfig } from "@/config/site";
import { env } from "@/config/env";
import { FacebookPixel } from "@/lib/analytics/facebook-pixel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.name,
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {env.gtmId && <GoogleTagManager gtmId={env.gtmId} />}
      <body className="min-h-full flex flex-col">
        <FacebookPixel />
        {children}
      </body>
      {env.gaId && <GoogleAnalytics gaId={env.gaId} />}
    </html>
  );
}
