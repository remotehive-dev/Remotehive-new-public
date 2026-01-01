import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import { fixupConfigRules } from "@eslint/compat";
import unicorn from "eslint-plugin-unicorn";
import lingui from "eslint-plugin-lingui";

export default [
  { ignores: ["dist/**", "coverage/**"] },
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  {
    plugins: {
      unicorn,
      lingui
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react/display-name": "off",
      "lingui/no-unlocalized-strings": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "lingui/text-restrictions": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "unicorn/prefer-add-event-listener": "off",
      "unicorn/prefer-blob-reading-methods": "off",
      "react/no-unknown-property": "off",
      "unicorn/better-regex": "off",
      "prefer-const": "off",
      "no-useless-catch": "off",
      "no-useless-escape": "off",
      "no-irregular-whitespace": "off",
      "no-prototype-builtins": "off",
      "no-empty": "off",
      "unicorn/prefer-spread": "off"
    }
  }
];
