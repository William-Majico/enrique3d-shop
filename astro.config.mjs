import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  
  integrations: [tailwind()]
});

// @ts-check
//import { defineConfig } from 'astro/config';

// https://astro.build/config
//export default defineConfig({});
