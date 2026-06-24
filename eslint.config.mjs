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
];

export default eslintConfig;
