// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    rules: {
      // Warn when defined variables are not used
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",

      // Allow Vue templates to contain multiple root elements
      "vue/no-multiple-template-root": "off",

      // Allow closing HTML brackets to appear on their own line
      "vue/html-closing-bracket-newline": "off",

      // Allow a line break before the first HTML attribute
      "vue/first-attribute-linebreak": "off",

      // Enforce consistent quoting of object properties (all quoted or none)
      "quote-props": ["error", "consistent"],

      // Allow comments with or without a space after comment characters
      "spaced-comment": "off",

      // Enforce single spaces, ignoring spaces before end-of-line comments
      "no-multi-spaces": ["error", { ignoreEOLComments: true }],

      // Enforce double quotes for strings
      "quotes": ["error", "double"],

      // Require semicolons at the end of statements
      "semi": ["error", "always"],

      // Allow trailing (dangling) commas
      "comma-dangle": "off",

      // Warn on empty block statements
      "no-empty": "warn",

      // Enforce TypeScript in component <script> blocks (lang="ts")
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts", "**/*.vue"],
    rules: {
      // Defer to @typescript-eslint/no-unused-vars in TypeScript to avoid interface param false positives
      "no-unused-vars": "off",
    },
  },
);
