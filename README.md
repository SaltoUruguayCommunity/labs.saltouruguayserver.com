# Astro Starter Kit: Minimal

```sh
pnpm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Publicar un ZIP en Labs

En **Nuevo Deploy**, seleccioná o arrastrá un ZIP con la web estática ya compilada.
Incluí `index.html`, CSS, JavaScript, imágenes y fuentes. Labs conserva las carpetas
internas y elimina automáticamente una carpeta contenedora común. No ejecuta builds
ni servidores: para Vite u otros frameworks, comprimí el contenido de `dist` o `build`.

Usá enlaces relativos (`./assets/app.js`, `./style.css`), ya que la web se sirve desde
`/u/usuario/proyecto/`. En Vite configurá `base: './'` antes de compilar.
Los enlaces absolutos como `/assets/app.js` apuntan a la raíz de Labs.

Límites: 3 MB de ZIP, 8 MB descomprimidos, 500 archivos y 512 KB por archivo.
Se omiten archivos ocultos, `__MACOSX` y `node_modules`; se rechazan rutas inválidas
y tipos que no correspondan a archivos estáticos. La versión queda sin publicar
hasta que se active desde el proyecto, igual que las subidas HTML individuales.

Los recursos del ZIP se guardan en `deploy_pages.content` con un prefijo versionado,
MIME y base64. Los HTML de versiones anteriores mantienen su formato original;
no se necesita una migración. La creación de cada versión usa una transacción.

Pruebas: `node --experimental-strip-types --test src/lib/deploy-files.test.ts`.
