# @atul-shaw/create-next-app

Scaffold a new Next.js project with a production-ready, opinionated architecture — TypeScript, Tailwind CSS v4, Zustand, axios — structured so it stays maintainable as it grows, instead of becoming an unstructured pile of files six months in.

## Contents

- [Why this exists](#why-this-exists)
- [Quick start](#quick-start)
- [What you get](#what-you-get)
- [The architecture](#the-architecture)
- [Folder structure](#folder-structure)
- [File naming convention](#file-naming-convention)
- [Worked example: the `product` feature that ships with it](#worked-example-the-product-feature-that-ships-with-it)
- [Adding your own feature](#adding-your-own-feature)
- [Error handling](#error-handling)
- [Requirements](#requirements)

## Why this exists

Most scaffolders give you a blank slate — fine for a demo, painful for a real product once more than one developer is adding features to it. This template starts you with the structural decisions already made, and **enforced by lint rules, not just documented and hoped for**:

- **Feature-based folders** (`features/<domain>/`) instead of type-based ones — a feature's components, hooks, and types live together, not scattered across app-wide `components/`, `hooks/` folders.
- **One-directional data flow**, enforced by ESLint: `UI → hook → service → data → API`. A component can never reach past its hook into a service or the API client directly — the lint step fails if it does.
- **Centralized `data/` and `services/` layers** (a repository pattern) so business logic shared by multiple features — a wishlist toggle needed on both a product page and a wishlist page, say — lives in exactly one place instead of being duplicated per feature.
- **DTO / domain-interface separation** — the backend's raw response shape and the shape your UI actually works with are different types, connected by a mapper. A backend field rename touches one file, not every component that uses that data.
- **Typed error handling** built in — a single `AppError` type, one axios interceptor that classifies every failed request, and Next.js error boundaries wired up out of the box.
- **File-size limits, lint-enforced** — route files cap at 80 lines, everything else at 200, so nothing quietly grows into an unreadable 900-line component.
- **SEO-ready** — native `generateMetadata`, `sitemap.ts`, `robots.ts`, `next/image` throughout.

## Quick start

```bash
npx @atul-shaw/create-next-app my-project
# or, with no name, it prompts:
npx @atul-shaw/create-next-app
```

```bash
cd my-project
npm install
# fill in .env.local with your real API base URL
npm run dev
```

## What you get

- Next.js 16 (App Router) + TypeScript strict mode
- Tailwind CSS v4
- Zustand for state
- axios with request/response interceptors already wired to the error-handling layer
- One fully working example feature (`product`) — DTO → mapper → data layer → service → hook → component — built end to end, as the pattern to copy for every feature you add
- ESLint rules that fail the build if the architecture is violated, not just a doc explaining what you're supposed to do

## The architecture

Logic flows in one direction, never backwards:

```
app/ (routes)  →  feature barrel (index.ts)  →  components  →  hooks  →  services/  →  data/  →  lib/api  →  backend
```

A component never imports `axios`, `data/`, or `services/` directly — only through a hook. A route never reaches into a feature's internals — only through its `index.ts` barrel. This isn't just a convention written in a doc: it's enforced by ESLint (`no-restricted-imports` rules in `eslint.config.mjs`), so a violation fails `npm run lint`.

**Why `data/` and `services/` are centralized, not nested inside each feature**: imagine a wishlist "add/remove" toggle needed on both a product detail page and a dedicated wishlist page. If the logic lived inside `features/wishlist/`, the product page would either duplicate it or reach into another feature's internals. Instead, `src/services/wishlist.service.ts` is centralized (still one file per domain, never one giant file) — every consumer, in any feature, calls the exact same function. One place to change, ever.

**Split responsibility:**
- **`src/data/*.data.ts`** — pure API access. Calls `apiClient`, maps the DTO to the domain type. No decisions, no business rules.
- **`src/services/*.service.ts`** — business logic built on top of `data/`. Thin where there's no real decision to make yet (like the shipped `product.service.ts`), or the actual home for logic like a wishlist toggle.

A feature's `dto/`, `interfaces/`, `mappers/` stay inside the feature — they're just type/pure-function files, not logic that needs sharing across features.

## Folder structure

```
src/
  app/                        # routes only — thin, mostly composition + metadata (≤80 lines, lint-enforced)
    product/[slug]/page.tsx
    sitemap.ts
    robots.ts
    layout.tsx

  features/                   # one folder per domain — components, hooks, types
    product/                  #   ← ships built end-to-end, copy this structure for every new feature
      dto/product.dto.ts             # raw API response shape
      interfaces/
        product.interface.ts          # domain model the rest of the app consumes
        product-card.interface.ts      # component prop types live here too
      mappers/product.mapper.ts       # dto -> domain
      components/ProductCard.tsx
      hooks/use-product.hook.ts        # calls src/services/product.service.ts
      store/product.store.ts
      index.ts                         # barrel — the only path other layers use to reach this feature

  data/                        # centralized, one file per domain — pure API access + mapping
    product.data.ts

  services/                    # centralized, one file per domain — business logic on top of data/
    product.service.ts

  components/                 # cross-feature design system — presentational only, no data fetching
    ui/                       # primitives: Button, Input, Modal...
    layout/                   # Navbar, Footer
    common/                   # generic reusable pieces

  lib/
    api/client.ts              # the single axios instance + interceptors
    api/endpoints.ts            # centralized URL builder
    seo/metadata.ts              # generateMetadata helper
    errors/app-error.ts           # AppError class + HTTP-status classifier
    errors/log-error.ts             # single error-logging call site

  store/                       # ONLY truly global zustand stores (cross-feature UI state)
  types/                        # ONLY truly global/shared types
  config/                        # env.ts (typed env access), site.ts (site config)
```

## File naming convention

| Kind | Suffix | Lives in |
|---|---|---|
| Raw API DTO | `*.dto.ts` | feature |
| Domain interface | `*.interface.ts` | feature |
| Mapper | `*.mapper.ts` | feature |
| Pure API access | `*.data.ts` | `src/data/` (centralized) |
| Business logic | `*.service.ts` | `src/services/` (centralized) |
| Hook | `*.hook.ts` | feature |
| Zustand store | `*.store.ts` | feature (or `src/store/` if global) |
| Component | `PascalCase.tsx` | feature |

This isn't just a style choice — the ESLint boundary rules match on the import specifier itself (`import ... from "@/services/product.service"` is blocked from a component because the specifier ends in `.service`). The naming convention is what makes the enforcement possible.

## Worked example: the `product` feature that ships with it

Every project you scaffold already has this built end to end — open these files after running the CLI to see the pattern in real code, not pseudocode.

**1. `features/product/dto/product.dto.ts`** — mirrors the raw backend shape:

```ts
export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  price_amount: number;
  price_currency: string;
  image_url: string;
}
```

**2. `features/product/interfaces/product.interface.ts`** — the clean shape the UI works with:

```ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: { amount: number; currency: string };
  imageUrl: string;
}
```

**3. `features/product/mappers/product.mapper.ts`** — the translation, small and boring on purpose:

```ts
export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    price: { amount: dto.price_amount, currency: dto.price_currency },
    imageUrl: dto.image_url,
  };
}
```

**4. `src/data/product.data.ts`** — the only file allowed to call the API for this domain:

```ts
export async function fetchProductBySlug(slug: string): Promise<Product> {
  const { data } = await apiClient.get<ApiResponse<ProductDto>>(
    endpoints.products.bySlug(slug),
  );
  return toProduct(data.data);
}
```

**5. `src/services/product.service.ts`** — the business-logic layer everything else actually calls:

```ts
export async function getProductBySlug(slug: string): Promise<Product> {
  return fetchProductBySlug(slug);
}
```

**6. `features/product/hooks/use-product.hook.ts`** — wraps the service call in React state for client components. **7. `features/product/components/ProductCard.tsx`** — the UI, built last, once the data shape is known.

**8. `features/product/index.ts`** — the barrel, the only door other code uses to reach this feature:

```ts
export { ProductCard } from "./components/ProductCard";
export { useProduct } from "./hooks/use-product.hook";
export { getProductBySlug, getProducts } from "@/services/product.service";
export type { Product } from "./interfaces/product.interface";
```

**9. `app/product/[slug]/page.tsx`** — a route, calling the feature only through its barrel:

```tsx
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug); // from "@/features/product"
  return <main>{/* ... */}</main>;
}
```

## Adding your own feature

Copy `features/product/`'s structure. **Write the files outside-in, not top-to-bottom** — you can't design a component's props before you know what data it's showing:

1. `features/<name>/dto/*.dto.ts` — the raw backend shape
2. `features/<name>/interfaces/*.interface.ts` — the clean domain shape
3. `features/<name>/mappers/*.mapper.ts` — dto → domain
4. `src/data/<name>.data.ts` — pure fetch + mapping
5. `src/services/<name>.service.ts` — the business logic
6. `features/<name>/hooks/*.hook.ts` — wraps the service call in React state
7. `features/<name>/interfaces/*-card.interface.ts` — component props, written last
8. `features/<name>/components/*.tsx` — the UI
9. `features/<name>/index.ts` — the barrel

## Error handling

Every request through `apiClient` fails, if it fails, as a typed `AppError` — never a raw axios error:

```
axios rejects → interceptor classifies status (classifyHttpStatus) → wraps as AppError → logError() → rejects with AppError
```

`AppError` carries a `code` (`"NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION" | "NETWORK" | "UNKNOWN"`), so callers branch on *why* it failed instead of parsing a message string. The service layer is deliberately Next.js-agnostic — it doesn't know what `notFound()` is; deciding how to react to an error is the page's job:

```ts
async function loadProduct(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error; // anything else -> caught by the nearest error.tsx
  }
}
```

`app/error.tsx` and `app/global-error.tsx` catch anything rethrown, so one failing request never crashes the whole app.

## Requirements

Node.js 18+.

## License

MIT

---

## For maintainers of this package

The `template/` folder is a generated copy of this scaffold's source project, not hand-edited. After changing the source, resync before publishing:

```bash
npm run sync-template
```

This copies the source over (excluding `node_modules`, `.next`, `.git`, and other machine/tool-specific or private files), replaces the source project's own name with the `__PROJECT_TITLE__` placeholder in text files, strips a private gitignore entry that's specific to the source project's own tooling, and regenerates `env.example` from the source's env file. `bin/create.js` replaces that placeholder with the new project's title-cased name at scaffold time, and sets `package.json`'s `name`/`version` directly. `.gitignore` and `.env.example` ship under non-dot names (`gitignore`, `env.example`) because npm's default packing rules silently drop dotfiles matching `.gitignore`/`.env*` — `create.js` restores the real names when it scaffolds a new project.

### Publishing a new version

```bash
npm run sync-template   # make sure template/ reflects the latest source
npm version patch       # or minor/major
npm publish --access public
```

A published version can't be edited or reliably unpublished after 72 hours — ship a new patch version rather than trying to fix one in place.
