import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ["out/**", ".next/**", "node_modules/**", "docs/project/**"],
  },
];

export default eslintConfig;
