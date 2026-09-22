import { create } from "zustand";
import type { Product } from "../interfaces/product.interface";

interface ProductState {
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  recentlyViewed: [],
  addRecentlyViewed: (product) =>
    set((state) => ({
      recentlyViewed: [
        product,
        ...state.recentlyViewed.filter((p) => p.id !== product.id),
      ].slice(0, 10),
    })),
}));
