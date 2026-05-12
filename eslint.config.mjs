import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import noSecrets from "eslint-plugin-no-secrets";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs"],
    plugins: {
      "@next/next": nextPlugin,
      "no-secrets": noSecrets,
    },
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...prettier.rules,
      "no-secrets/no-secrets": "error",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-inline-styles": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {},
  },
];
