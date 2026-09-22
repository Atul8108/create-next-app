import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Enforces the one-directional flow:
//   app -> feature barrel -> components -> hooks -> services/ -> data/ -> lib/api
//
// data/ and services/ are centralized (one file per domain), not feature-scoped, so any
// feature can reuse the same service instead of duplicating logic (e.g. a wishlist toggle
// used by both the product page and the wishlist page calls the same src/services/wishlist.service.ts).
// A feature's dto/interfaces/mappers stay inside the feature — they're just type/pure-fn
// files, so data/ and services/ are allowed to deep-import those specifically, but never a
// feature's components/hooks/store.
const featureInternalsBlock = [
  {
    group: [
      "@/features/*/components/**",
      "@/features/*/hooks/**",
      "@/features/*/store/**",
    ],
    message:
      "Only deep-import a feature's dto/interfaces/mappers here — never its components, hooks, or store.",
  },
];

const layerBoundaries = [
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/api", "@/lib/api/**", "@/data", "@/data/**", "@/services", "@/services/**"],
              message:
                "Routes must not call the API/data/service layers directly — import from a feature's index instead.",
            },
            {
              group: ["@/features/*/**"],
              message:
                "Routes must only import a feature's public barrel (@/features/<name>), not its internals.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
      "src/config/**/*.{ts,tsx}",
    ],
    ignores: ["src/lib/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/api", "@/lib/api/**", "@/data", "@/data/**", "@/services", "@/services/**"],
              message: "Only src/data/** may call the API layer, and only src/services/** may call src/data/**.",
            },
            {
              group: ["@/features/*/**"],
              message:
                "Shared code must only import a feature's public barrel (@/features/<name>), not its internals.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/store/**/*.{ts,tsx}", "src/features/*/hooks/**/*.{ts,tsx}", "src/features/*/store/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/api", "@/lib/api/**", "@/data", "@/data/**"],
              message: "Hooks/stores must not call the API/data layer directly — go through src/services/**.",
            },
            {
              group: ["**/*.dto"],
              message: "Hooks/stores must not import a DTO — use the domain interface instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/*/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/api", "@/lib/api/**", "@/data", "@/data/**", "@/services", "@/services/**"],
              message:
                "Components must not call the API/data/service layers directly — use a feature hook instead.",
            },
            {
              group: ["**/*.dto"],
              message:
                "Components must not import a DTO — use the domain interface instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/data/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/services", "@/services/**"],
              message: "data/ is the lowest layer — it must not import services/ (that would be circular).",
            },
            ...featureInternalsBlock,
          ],
        },
      ],
    },
  },
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/api", "@/lib/api/**"],
              message: "services/ must not call the API layer directly — go through data/.",
            },
            ...featureInternalsBlock,
          ],
        },
      ],
    },
  },
];

// Soft line-count caps so no file quietly grows into a 900-line modal.
// Route files are pure composition and get the tightest cap.
const fileSizeLimits = [
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/global-error.tsx",
    ],
    rules: {
      "max-lines": ["warn", { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...layerBoundaries,
  ...fileSizeLimits,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
