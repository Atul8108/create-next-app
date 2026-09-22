import type { ProductDto } from "../dto/product.dto";
import type { Product } from "../interfaces/product.interface";

export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    price: {
      amount: dto.price_amount,
      currency: dto.price_currency,
    },
    imageUrl: dto.image_url,
  };
}
