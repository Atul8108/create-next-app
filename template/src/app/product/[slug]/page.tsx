import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/features/product";
import { buildMetadata } from "@/lib/seo/metadata";
import { AppError } from "@/lib/errors/app-error";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function loadProduct(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  return buildMetadata({
    title: product.name,
    path: `/product/${product.slug}`,
    image: product.imageUrl,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{product.name}</h1>
      <p className="mt-2 text-neutral-500">
        {product.price.currency} {product.price.amount}
      </p>
    </main>
  );
}
