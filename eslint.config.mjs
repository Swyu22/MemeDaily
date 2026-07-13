/**
 * input: first-party Next.js/TypeScript source and declared module ownership boundaries
 * output: blocking correctness, type-safety, and architecture lint rules
 * pos: canonical application lint configuration used by local checks and CI
 */
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  // Type-aware TS rules (no-explicit-any, etc.) so unsafe casts / `any` are caught at the
  // lint layer, not only by `tsc`. Enforced via `npm run lint` (--max-warnings=0) + CI.
  ...nextTypescript,
  {
    ignores: ["out/**", ".next/**", "node_modules/**", "docs/project/**"],
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/app/**", "@/features/**", "**/app/**", "**/features/**", "next", "next/**"],
          message: "Domain modules must remain independent from routes, React features, and Next.js.",
        }],
      }],
    },
  },
  {
    files: ["src/{app,features}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/../scripts/**", "**/scripts/**"],
          message: "Runtime UI modules must not import automation scripts.",
        }],
      }],
    },
  },
];

export default eslintConfig;
