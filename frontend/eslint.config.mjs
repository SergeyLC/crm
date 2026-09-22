import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

const config = [
    // next/typescript already includes @typescript-eslint — do not re-register it
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            // project-specific overrides
        },
    },
    {
        ignores: [
            "src/shared/generated/**/*",
            "src/prisma/**/*",
            ".next/**/*",
            "**/*.js",
            "**/*.d.ts",
        ],
    },
];

export default config;
