import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // These Node.js scripts use CommonJS, not application ES modules.
    files: [
      "fix-borders.js",
      "fix-tables.js",
      "fix-toolbars.js",
      "patch_layout_iconify.js",
      "rewrite-reports.js",
      "rewrite-settings.js",
      "scripts/statusline.cjs",
      "strip-titles.js",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Nested worktrees are separate checkouts, not source for this checkout.
    ".claude/worktrees/**",
    // Installed agent tooling and bundled dependencies have their own lint scope.
    ".agents/skills/**",
    ".claude/skills/**",
  ]),
]);

export default eslintConfig;
