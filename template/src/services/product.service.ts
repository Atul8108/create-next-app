import { fetchProductBySlug, fetchProducts } from "@/data/product.data";
import type { Product } from "@/features/product/interfaces/product.interface";

export async function getProductBySlug(slug: string): Promise<Product> {
  return fetchProductBySlug(slug);
}

export async function getProducts(): Promise<Product[]> {
  return fetchProducts();
}
