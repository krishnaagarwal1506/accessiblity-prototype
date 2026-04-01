import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import frontendRules from "eslint-frontend-rules";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // v3 recommended config — includes plugin + all rules at sensible defaults
  frontendRules.configs.recommended,
  {
    rules: {
      // --- Override rules too aggressive for this codebase ---

      // No Typography system in this project
      "eslint-frontend-rules/enforce-typography-components": "off",

      // Extension intentionally uses raw hex/rgba colors
      "eslint-frontend-rules/no-direct-colors": "off",

      // Existing files use PascalCase (ScoreGauge.tsx, etc.)
      "eslint-frontend-rules/enforce-kebab-case-filenames": "off",

      // Existing types don't follow I-prefix / T-prefix convention
      "eslint-frontend-rules/enforce-interface-type-naming": "off",

      // React components + App.tsx use default exports
      "eslint-frontend-rules/no-default-export": "off",

      // Too noisy for top-level consts like SEVERITY_WEIGHTS
      "eslint-frontend-rules/top-level-const-snake": "off",

      // No cn() utility in this project
      "eslint-frontend-rules/enforce-classname-utility": "off",

      // Has a bug with overlapping fixes in ESLint 10
      "eslint-frontend-rules/enforce-event-handler-naming": "off",

      // JSDoc rules — too noisy for a small extension project
      "eslint-frontend-rules/require-jsdoc-on-root-function": "off",
      "eslint-frontend-rules/require-jsdoc-on-component": "off",
      "eslint-frontend-rules/require-jsdoc-on-hook": "off",

      // Ignore sibling imports within the same directory (checks/*.ts)
      "eslint-frontend-rules/enforce-alias-import-paths": [
        "warn",
        { aliases: ["@"], ignore: ["**/checks/*.ts"] },
      ],

      // --- TypeScript overrides ---
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "*.config.*"],
  },
);
