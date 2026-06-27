// @ts-check
import { defineConfig, envField } from 'astro/config';
import auth from 'auth-astro';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

import vercel from '@astrojs/vercel';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  output: 'server',

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },

  integrations: [
    auth(),
  ],

  env: {
    schema: {
      AUTH_SECRET: envField.string({ context: 'server', access: 'secret' }),
      SUS_OAUTH_CLIENT_ID: envField.string({ context: 'server', access: 'secret' }),
      SUS_OAUTH_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
      SUS_OAUTH_ISSUER: envField.string({ context: 'server', access: 'public', default: 'https://saltouraguayserver.com' }),
      TURSO_DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      TURSO_AUTH_TOKEN: envField.string({ context: 'server', access: 'secret' }),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 3211,
  },

  adapter: vercel(),
});
