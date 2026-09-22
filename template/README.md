# __PROJECT_TITLE__

A production-ready Next.js starter — TypeScript, Tailwind v4, Zustand, axios — with an enforced feature-based architecture. Ships with a working example feature (`product`) as the reference pattern to copy.

## Contents

- [Setup](#setup)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Building a feature](#building-a-feature)
- [Worked example: building `/profile`](#worked-example-building-profile)
- [Error handling](#error-handling)
- [Build order across the app](#build-order-across-the-app)
- [Conventions](#conventions)

## Setup

```bash
npm install
npm run dev
```

Requires a `.env.local` with:

```
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_SITE_URL=
```

## Architecture

**Feature-Sliced Design** (folders by domain — `features/product`, `features/cart` — not by technical type) combined with **Clean Architecture's dependency rule** (strict one-directional data flow, applied inside each feature):

```
app/ (routes)  →  feature barrel (index.ts)  →  components  →  hooks  →  services/  →  data/  →  lib/api  →  backend
```

A component never imports `axios`, `data/`, or `services/` directly — only through a hook. A route never reaches into a feature's internals — only through its `index.ts`. **`data/` and `services/` are centralized at `src/`, not nested inside each feature** — see below for why. This is enforced by ESLint (`no-restricted-imports` in `eslint.config.mjs`), not just convention: violating it fails `npm run lint`.

<details>
<summary><strong>Why are <code>data/</code> and <code>services/</code> centralized instead of living inside each feature?</strong></summary>

A concrete case: a wishlist "add/remove" toggle is needed both on the product detail page (a heart icon) and on the dedicated wishlist page. If `wishlist.service.ts` lived inside `features/wishlist/`, `ProductCard` (inside `features/product`) would have to either duplicate that logic or reach into another feature's internals — either way, a change means hunting down more than one copy. Instead, `src/services/wishlist.service.ts` is centralized (still one file per domain, never one giant file), so `features/wishlist`'s own page **and** `features/product`'s `ProductCard` both call `useWishlist()` → the same `wishlist.service.ts` → the same `wishlist.data.ts`. One place to change, ever.

</details>

<details>
<summary><strong>Split responsibility: <code>data/</code> vs <code>services/</code></strong></summary>

- **`src/data/*.data.ts`** — pure API access. Calls `apiClient`, maps the DTO to the domain type via that feature's mapper. No decisions, no business rules.
- **`src/services/*.service.ts`** — business logic built on top of `data/`. For `product` today this is mostly a thin pass-through; for `wishlist` this is where `toggleWishlist(productId, currentItems)` would decide add-vs-remove.

A feature's `dto/`, `interfaces/`, `mappers/` stay inside the feature — they're just type/pure-fn files, not logic that needs sharing. `data/` and `services/` are allowed to deep-import those specifically, but never a feature's `components/`, `hooks/`, or `store/` (enforced by lint).

</details>

<details>
<summary><strong>Why "DTO"?</strong></summary>

**DTO = Data Transfer Object.** The standard term for "the raw shape of data as it crosses a system boundary" — here, exactly what the backend API sends over HTTP, before your app touches it. We keep it separate from the **domain interface** (`*.interface.ts`), which is the shape *your app* wants to work with. The backend can rename a field, add nesting, or switch `snake_case` to something else, and only the `*.mapper.ts` file has to change — no component or hook ever notices, because they only ever see the domain interface. This split is sometimes called an **Anti-Corruption Layer** (from Domain-Driven Design): it stops the backend's data shape from "corrupting" your app's own types.

</details>

## Project structure

Only `features/` holds domain logic. Everything else under `src/` is deliberately "dumb" — no business logic, no API calls tied to a specific domain.

**Rule of thumb**: if a file needs to know what a "product" or an "order" is, it belongs inside `features/`. If it would make sense unchanged in a completely different e-commerce app, it belongs in one of the folders below.

| Folder | What goes here | What must NOT go here |
|---|---|---|
| `app/` | Routes only. Thin composition, capped at 80 lines. | Business logic, direct API/axios calls — import a feature's barrel instead. |
| `features/` | Per-domain `dto/`, `interfaces/`, `mappers/`, `components/`, `hooks/`, `store/` (`product`, `cart`, ...). See [Building a feature](#building-a-feature). | Data-access or business-logic files — those live in `data/`/`services/` below. |
| `data/` | Centralized, one file per domain — pure API access (`product.data.ts`, `wishlist.data.ts`, ...). | Business decisions — that's `services/`. |
| `services/` | Centralized, one file per domain — business logic on top of `data/`. | Direct `apiClient`/axios calls — that's `data/`'s job. |
| `components/` | Cross-feature, reusable, presentational UI: `ui/` (Button, Input), `layout/` (Navbar, Footer), `common/` (Breadcrumb, StarRating). | Any feature-specific knowledge, any data fetching. |
| `lib/api/` | The **one** axios instance + interceptors (`client.ts`) and the endpoint URL builder (`endpoints.ts`). | Anything domain-specific — that's what `data/` is for. |
| `lib/seo/` | Shared SEO helpers, e.g. `buildMetadata()` used by every route's `generateMetadata`. | — |
| `store/` | **Global** Zustand stores only — cross-cutting UI state like "is the cart drawer open". | Domain data (products, cart items) — belongs in the owning feature's own `store/`. |
| `types/` | **Global** shared types only — the generic `ApiResponse<T>` envelope, ambient declarations. | Anything feature-specific — belongs in that feature's `interfaces/`. |
| `config/` | `env.ts` (typed `process.env` access), `site.ts` (site name/URL/description). | Secrets, per-feature config. |

### `app/` — file-based routing

Next.js reads this folder structure directly and turns it into URLs. A folder is a URL segment; specific filenames are reserved:

| File | Purpose | When you add one |
|---|---|---|
| `page.tsx` | Makes that folder a real route | Every new URL, e.g. `app/cart/page.tsx` → `/cart` |
| `layout.tsx` | Wraps `page.tsx` (and everything nested under it) — shared Navbar/Footer, persists across navigation | Once at the root (already exists), plus per-section if a group of pages needs its own shell |
| `loading.tsx` | Auto-shown while `page.tsx` is fetching — no manual state needed | Any route whose data fetch isn't instant |
| `error.tsx` | Auto-shown if `page.tsx` throws | Any route where a fetch can realistically fail |
| `sitemap.ts` / `robots.ts` | Served as actual `/sitemap.xml` and `/robots.txt` | Already built — extend `sitemap.ts` as new routes are added |

`[slug]` in a folder name (e.g. `app/product/[slug]/page.tsx`) is a dynamic segment, handed to the page as `params`.

A `page.tsx` stays thin: fetch via the feature's barrel, pass to `buildMetadata()`, render. No business logic, no state management inside it — that's what the 80-line cap checks for. If a page file is growing, the markup belongs in a feature's `components/`, not the page.

### Shared infrastructure — when and how

- **`lib/api/`** — touched once, wiring up the real backend, rarely after. `client.ts` is the single axios instance; edit it only for cross-cutting concerns (auth token handling, a new interceptor, retry logic). `endpoints.ts` holds every URL path — add a domain's paths here, then its `src/data/*.data.ts` imports from it instead of hardcoding strings.
- **`lib/seo/`** — `buildMetadata()` is a helper you *call* from every route's `generateMetadata` (see `app/product/[slug]/page.tsx`), not something you edit per page. Edit the file itself only to add a new shared SEO concern, e.g. a JSON-LD helper.
- **`store/`** — global Zustand stores for state no single feature owns, like "is the cart drawer open" (`ui.store.ts`). Before adding here, ask: *is this really cross-feature UI state, or is it product/cart/order data I'm tempted to dump here for convenience?* Domain data belongs in that feature's own `store/` — putting it here quietly breaks feature isolation.
- **`types/`** — only for a shape two-plus unrelated features genuinely share, like the `ApiResponse<T>` envelope. Future example: `Address`, needed by both `checkout` and `orders` — that's when it earns a spot in `types/shared/`, instead of one feature importing the other's `interfaces/`.
- **`config/`** — `env.ts` is the *only* place `process.env` gets read directly; everywhere else imports `env.apiBaseUrl` etc. from here, so there's one place to see every env var and TypeScript catches typos. Add a new var to both `env.ts` and `types/global.d.ts`'s `ProcessEnv` interface together. `site.ts` holds site-wide branding/copy that `lib/seo/metadata.ts` reads from.

## Building a feature

`src/features/product/` is the reference implementation — copy its folder structure for every new feature. **Write the files outside-in, not top-to-bottom**: you can't design a component's props before you know what data it's showing.

1. **`features/<name>/dto/*.dto.ts`** — the raw shape the backend actually returns (snake_case, whatever the API gives you)
2. **`features/<name>/interfaces/*.interface.ts`** — the clean shape the UI works with (camelCase, only the fields you use)
3. **`features/<name>/mappers/*.mapper.ts`** — the dto → domain translation. Small and boring, that's correct.
4. **`src/data/<name>.data.ts`** (centralized, not inside the feature) — calls `apiClient`, runs the mapper, returns the domain type. "Fetch a product," nothing more.
5. **`src/services/<name>.service.ts`** (centralized) — the business logic on top of step 4. Thin/pass-through is fine if there's no real decision to make yet.
6. **`features/<name>/hooks/*.hook.ts`** — wraps a call to the service in React state (loading/error) for client components
7. **`features/<name>/interfaces/*-card.interface.ts`** (component props) — written *after* you know what data the component needs
8. **`features/<name>/components/*.tsx`** — the UI, built last
9. **`features/<name>/index.ts`** — the feature's public barrel; every other layer imports the feature only through this file

## Worked example: building `/profile`

Same 9 steps as above, with actual code, so there's no ambiguity about what "properly" means. This feature doesn't exist in the codebase yet — it's illustrative, copy the pattern when you actually build it.

**1. `features/profile/dto/profile.dto.ts`** — mirror whatever the backend literally returns:

```ts
export interface ProfileDto {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url: string | null;
}
```

**2. `features/profile/interfaces/profile.interface.ts`** — the clean shape the UI will actually use:

```ts
export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
}
```

**3. `features/profile/mappers/profile.mapper.ts`**:

```ts
import type { ProfileDto } from "../dto/profile.dto";
import type { Profile } from "../interfaces/profile.interface";

export function toProfile(dto: ProfileDto): Profile {
  return {
    id: dto.user_id,
    fullName: dto.full_name,
    email: dto.email,
    phoneNumber: dto.phone_number,
    avatarUrl: dto.avatar_url,
  };
}
```

**4. Register the URL, then the data layer.** First add the path to `lib/api/endpoints.ts`:

```ts
export const endpoints = {
  products: { /* ... */ },
  profile: {
    me: "/profile/me",
  },
} as const;
```

Then `src/data/profile.data.ts` — centralized, not inside the feature, and the only file allowed to import `lib/api` for this domain:

```ts
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api-envelope.interface";
import type { ProfileDto } from "@/features/profile/dto/profile.dto";
import type { Profile } from "@/features/profile/interfaces/profile.interface";
import { toProfile } from "@/features/profile/mappers/profile.mapper";

export async function fetchProfile(): Promise<Profile> {
  const { data } = await apiClient.get<ApiResponse<ProfileDto>>(
    endpoints.profile.me,
  );
  return toProfile(data.data);
}
```

**5. `src/services/profile.service.ts`** — also centralized; the business-logic layer that hooks actually call:

```ts
import { fetchProfile } from "@/data/profile.data";
import type { Profile } from "@/features/profile/interfaces/profile.interface";

export async function getProfile(): Promise<Profile> {
  return fetchProfile();
}
```

**6. `features/profile/hooks/use-profile.hook.ts`** — wraps a call to the service in React state for a client component:

```ts
"use client";

import { useEffect, useState } from "react";
import type { Profile } from "../interfaces/profile.interface";
import { getProfile } from "@/services/profile.service";

interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, isLoading: !profile && !error, error };
}
```

**7. `features/profile/interfaces/profile-card.interface.ts`** — written now that step 6 shows exactly what data is available:

```ts
import type { Profile } from "./profile.interface";

export interface ProfileCardProps {
  profile: Profile;
}
```

**8. `features/profile/components/ProfileCard.tsx`** — the UI, last:

```tsx
import Image from "next/image";
import type { ProfileCardProps } from "../interfaces/profile-card.interface";

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      {profile.avatarUrl && (
        <Image src={profile.avatarUrl} alt={profile.fullName} width={64} height={64} className="rounded-full" />
      )}
      <div>
        <h2 className="text-lg font-semibold">{profile.fullName}</h2>
        <p className="text-sm text-neutral-500">{profile.email}</p>
      </div>
    </div>
  );
}
```

**9. `features/profile/index.ts`** — the barrel; nothing outside this feature imports anything above directly:

```ts
export { ProfileCard } from "./components/ProfileCard";
export { useProfile } from "./hooks/use-profile.hook";
export type { Profile } from "./interfaces/profile.interface";
```

**10. Wire the route — `app/profile/page.tsx`**:

```tsx
"use client";

import { ProfileCard, useProfile } from "@/features/profile";

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile();

  if (isLoading) return <p>Loading...</p>;
  if (error || !profile) return <p>Could not load profile.</p>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <ProfileCard profile={profile} />
    </main>
  );
}
```

**Why this page is `"use client"` and doesn't use `generateMetadata` like the product page does**: profile data is per-logged-in-user, and `lib/api/client.ts` only reads the auth token from `document.cookie`, which doesn't exist during server rendering (see the `ponytail:` comment in that file). So a server component fetching profile data would always get an unauthenticated request. Until a server-safe auth-aware fetch exists, any page showing a signed-in user's own data has to fetch client-side via a hook, not server-side via the barrel's service function directly.

## Error handling

Every request through `apiClient` fails, if it fails, as an `AppError` — never a raw axios error. This is real, working code (not illustrative like the profile example above), verified against a live server by killing the backend and watching it work end-to-end.

**1. `lib/errors/app-error.ts`** — the typed error and a pure classifier function (kept pure and exported specifically so it's testable on its own):

```ts
export type AppErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "NETWORK"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;

  constructor(message: string, { code = "UNKNOWN", statusCode = 500, cause }: AppErrorOptions = {}) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function classifyHttpStatus(status: number | undefined): AppErrorCode {
  switch (status) {
    case 404: return "NOT_FOUND";
    case 401:
    case 403: return "UNAUTHORIZED";
    case 422: return "VALIDATION";
    default: return status === undefined ? "NETWORK" : "UNKNOWN";
  }
}
```

**2. `lib/errors/log-error.ts`** — one call site for every error, on purpose, so there's exactly one place to change when a real error-reporting service gets added:

```ts
// ponytail: console-only. Swap in a reporting service (Sentry, etc.) here
// when one is chosen — this is the single call site that needs to change.
export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[app-error]", error, context ?? "");
}
```

**3. `lib/api/client.ts`'s response interceptor** — this is where every axios failure gets converted, so no individual `src/data/*.data.ts` file has to catch or rewrap anything itself:

```ts
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    const message = /* ...extract message from error.response.data or error.message... */;

    const appError = new AppError(message, {
      code: classifyHttpStatus(statusCode),
      statusCode: statusCode ?? 500,
      cause: error,
    });

    logError(appError, { url: axios.isAxiosError(error) ? error.config?.url : undefined });
    return Promise.reject(appError);
  },
);
```

Because this lives in the interceptor, `src/data/product.data.ts` doesn't need a single line of error-handling code — every call through `apiClient` already rejects with a well-formed `AppError`.

**4. The page decides what an error means** — the service layer is deliberately Next.js-agnostic; it has no idea what `notFound()` is. That decision belongs to `app/product/[slug]/page.tsx`:

```tsx
async function loadProduct(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error; // anything else -> caught by the nearest error.tsx
  }
}
```

**5. `app/error.tsx`** catches anything rethrown from a route segment instead of crashing the whole app:

```tsx
"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { logError(error); }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-neutral-500">{error.message}</p>
      <button onClick={reset} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Try again
      </button>
    </main>
  );
}
```

`app/global-error.tsx` is the same idea, one level up — the last-resort fallback if the root `layout.tsx` itself throws. It has to render its own `<html>`/`<body>` since at that point it's replacing the root layout entirely.

**Proven, not assumed**: with no backend running, hitting `/product/test-slug` produced this in the server log —

```
[app-error] Error [AppError]: connect ECONNREFUSED ::1:4000; connect ECONNREFUSED 127.0.0.1:4000
  [cause]: AggregateError: ... code: 'ECONNREFUSED' ...
{ url: '/products/test-slug' }
```

— confirming the full chain: axios failure → wrapped as `AppError` → logged with the request URL as context → since the code isn't `NOT_FOUND`, rethrown → caught by `error.tsx` → page degrades to a retry screen instead of taking down the whole app.

## Build order across the app

1. **`product`** (browsing, no login) — done, use as the template
2. **`auth`** — needed before cart/checkout mean anything
3. **`cart`** — depends on product
4. **`checkout`** — depends on cart + auth
5. **`orders`, `wishlist`, `wallet`, `reviews`** — account-area features, same pattern each time

## Conventions

**File naming**

| Kind | Suffix | Lives in | Example |
|---|---|---|---|
| Raw API DTO | `*.dto.ts` | feature | `product.dto.ts` |
| Domain interface | `*.interface.ts` | feature | `product.interface.ts` |
| Mapper | `*.mapper.ts` | feature | `product.mapper.ts` |
| Pure API access | `*.data.ts` | `src/data/` (centralized) | `product.data.ts` |
| Business logic | `*.service.ts` | `src/services/` (centralized) | `product.service.ts` |
| Hook | `*.hook.ts` | feature | `use-product.hook.ts` |
| Zustand store | `*.store.ts` | feature (or `src/store/` if global) | `product.store.ts` |
| Component | `PascalCase.tsx` | feature | `ProductCard.tsx` |

**File size** — route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) cap at 80 lines; everything else under `src/` caps at 200 — lint-enforced (`warn`). Hitting the cap means split the file, not raise the number.
