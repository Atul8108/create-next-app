declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_BASE_URL: string;
      NEXT_PUBLIC_SITE_URL: string;
      NEXT_PUBLIC_GTM_ID: string;
      NEXT_PUBLIC_GA_ID: string;
      NEXT_PUBLIC_FB_PIXEL_ID: string;
    }
  }
}

export {};
