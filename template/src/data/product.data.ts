import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api-envelope.interface";
import type { ProductDto } from "@/features/product/dto/product.dto";
import type { Product } from "@/features/product/interfaces/product.interface";
import { toProduct } from "@/features/product/mappers/product.mapper";

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const { data } = await apiClient.get<ApiResponse<ProductDto>>(
    endpoints.products.bySlug(slug),
  );
  return toProduct(data.data);
}

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<ApiResponse<ProductDto[]>>(
    endpoints.products.list,
  );
  return data.data.map(toProduct);
}
