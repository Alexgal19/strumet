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
      // Klucze tłumaczeń (np. "schedule.employedActiveStatus") mają wysoką entropię, ale nie są sekretami
      "no-secrets/no-secrets": ["error", { ignoreContent: ["^[a-z]+\\.[a-zA-Z0-9]+$"] }],
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-inline-styles": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {},
  },
];
