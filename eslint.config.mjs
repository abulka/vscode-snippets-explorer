import globals from "globals";

export default [
  // ANDY: had to explicitly exclude .vscode-test from the ignore list
  // by adding this rule object to the array.
  {
    ignores: [
      "**/.vscode-test/**",
    ]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
        ...globals.mocha,
      },

      ecmaVersion: 2022,
      sourceType: "module",
    },

    rules: {
      "no-const-assign": "warn",
      "no-this-before-super": "warn",
      "no-undef": "warn",
      "no-unreachable": "warn",
      "no-unused-vars": "warn",
      "constructor-super": "warn",
      "valid-typeof": "warn",
    },
  }];