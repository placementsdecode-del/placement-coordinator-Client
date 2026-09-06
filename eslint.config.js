import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/services/**", "src/constants/api.ts", "src/data/commit-history.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/constants/api"], message: "Endpoint definitions belong in domain API services." }], paths: [{ name: "@/services/api-client", importNames: ["apiFetch"], message: "Call a domain API service instead." }] }],
      "no-restricted-syntax": ["error", { selector: "CallExpression[callee.name=fetch]", message: "Network requests must use the shared API client through a domain service." }],
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
