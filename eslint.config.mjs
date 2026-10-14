import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const compatibility = new FlatCompat({
  baseDirectory: rootDirectory,
  resolvePluginsRelativeTo: rootDirectory,
});

export default [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  ...compatibility.extends("next/core-web-vitals"),
];
