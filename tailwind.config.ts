import { join } from "path";
import containerQueries from "@tailwindcss/container-queries";
import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

import { skeleton } from "@skeletonlabs/tw-plugin";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    join(
      require.resolve("@skeletonlabs/skeleton"),
      "../**/*.{html,js,svelte,ts}"
    ),
  ],

  theme: {
    extend: {},
  },

  plugins: [
    forms,
    containerQueries,
    skeleton({ themes: { preset: ["sahara"] } }),
  ],
} satisfies Config;
