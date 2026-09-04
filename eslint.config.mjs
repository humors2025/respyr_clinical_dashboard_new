import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy PHP portal kept on disk for reference during the port. It is
    // gitignored and ships vendored jQuery/Bootstrap bundles that would
    // otherwise drown real findings in thousands of warnings.
    "clinical-v2/**",
    "clinical-dashboard_v2/**",
  ]),
]);

export default eslintConfig;
