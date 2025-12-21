import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
// import vercel from "@astrojs/vercel/serverless";  <-- COMENTA ESTA LÍNEA CON //

export default defineConfig({
  // output: 'server',       <-- COMENTA ESTA LÍNEA CON //
  // adapter: vercel(),      <-- COMENTA ESTA LÍNEA CON //
  
  integrations: [tailwind()]
});

// @ts-check
//import { defineConfig } from 'astro/config';

// https://astro.build/config
//export default defineConfig({});
