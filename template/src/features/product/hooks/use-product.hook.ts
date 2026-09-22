"use client";

import { useEffect, useState } from "react";
import type { Product } from "../interfaces/product.interface";
import { getProductBySlug } from "@/services/product.service";

interface UseProductResult {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
}

interface ProductFetchState {
  slug: string;
  product: Product | null;
  error: string | null;
}

export function useProduct(slug: string): UseProductResult {
  const [state, setState] = useState<ProductFetchState>({
    slug,
    product: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    getProductBySlug(slug)
      .then((product) => {
        if (!cancelled) setState({ slug, product, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ slug, product: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isCurrent = state.slug === slug;
  return {
    product: isCurrent ? state.product : null,
    isLoading: !isCurrent,
    error: isCurrent ? state.error : null,
  };
}
