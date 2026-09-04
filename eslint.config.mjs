import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

/*
 * eslint-config-next 15 ships eslintrc-style configs rather than flat-config
 * arrays, so they are bridged through FlatCompat. (Next 16 exports flat config
 * directly — revisit this file if the framework pin is ever raised.)
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Legacy PHP portal kept on disk for reference during the port. It is
      // gitignored and ships vendored jQuery/Bootstrap bundles that would
      // otherwise drown real findings in thousands of warnings.
      "clinical-v2/**",
      "clinical-dashboard_v2/**",
    ],
  },
];

export default eslintConfig;
