import Image from "next/image";
import Link from "next/link";
import type { ProductCardProps } from "../interfaces/product-card.interface";

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      <div className="relative aspect-square">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium">{product.name}</h3>
        <p className="text-sm text-neutral-500">
          {product.price.currency} {product.price.amount}
        </p>
      </div>
    </Link>
  );
}
