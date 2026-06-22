// Advisory complexity check — wires AGENTS.md §5 / CONSTITUTION §6 red-lines into ESLint.
// Run with `npm run lint:complexity`. Deliberately NOT part of `npm run lint` (which is
// `--max-warnings=0`): these are warn-level signals, not build-breaking gates. See ADR-004.
// Reuses the base config so the TS parser and Next plugins are already in place.
import base from "./eslint.config.mjs";

const complexityConfig = [
  ...base,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "max-lines": ["warn", { max: 800, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 30, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", 3],
      "max-nested-callbacks": ["warn", 3],
      complexity: ["warn", 4],
    },
  },
];

export default complexityConfig;
