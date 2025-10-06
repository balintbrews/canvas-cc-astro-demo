import { defineConfig, envField } from "astro/config";
import path from "path";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const DIR = new URL("./", import.meta.url).pathname;

export default defineConfig({
  env: {
    schema: {
      CANVAS_SITE_URL: envField.string({ context: "server", access: "public" }),
      CANVAS_PAGE_UUID: envField.string({
        context: "server",
        access: "public",
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
    // @see https://github.com/balintbrews/canvas-cc-starter/blob/main/vite.config.js
    resolve: {
      alias: [
        {
          find: "@/lib/utils",
          replacement: path.resolve(DIR, "./src/lib/drupal-canvas/utils.js"),
        },
        {
          find: "@/lib/FormattedText",
          replacement: path.resolve(
            DIR,
            "./src/lib/drupal-canvas/FormattedText.jsx",
          ),
        },
        {
          // Make sure we don't resolve nested folder structures under
          // `@/components/`, like `@/components/atoms/button`.
          // Those are not (yet) supported in Drupal Canvas.
          find: /^@\/components\/([a-z_-]+)$/,
          replacement: path.resolve(DIR, "./src/components/$1"),
        },
      ],
    },
  },

  integrations: [react()],
});
