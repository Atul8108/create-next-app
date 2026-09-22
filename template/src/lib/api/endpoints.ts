export const endpoints = {
  products: {
    list: "/products",
    bySlug: (slug: string) => `/products/${slug}`,
  },
} as const;
