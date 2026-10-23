import { unzipSync } from 'fflate';
import { Buffer } from 'node:buffer';

export class UploadError extends Error {}

export const MAX_UPLOAD = 3 * 1024 * 1024;
const MAX_EXPANDED = 8 * 1024 * 1024;
const MAX_FILE = 512 * 1024;
const MAX_FILES = 500;
const PREFIX = 'labs:asset:v1:';
export type DeployFile = { route: string; content: string };
const mimeTypes: Record<string, string> = {
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8', txt: 'text/plain; charset=utf-8', xml: 'application/xml',
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', ico: 'image/x-icon',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', wasm: 'application/wasm', pdf: 'application/pdf', map: 'application/json', webmanifest: 'application/manifest+json',
};
function validatePath(path: string) {
  if (!path || path.startsWith('/') || path.includes('\\') || /[\x00-\x1f:#?%]/.test(path) || path.split('/').some(p => p === '..' || p === '.' || !p)) {
    throw new UploadError('El ZIP contiene una ruta inválida.');
  }
}
function ignored(path: string) {
  return path.split('/').some(part => part.startsWith('.') || part === '__MACOSX' || part === 'node_modules');
}
export function extractZip(bytes: Uint8Array): DeployFile[] {
  if (bytes.length > MAX_UPLOAD) throw new UploadError('El ZIP no puede superar 3 MB.');
  let total = 0;
  let count = 0;
  const names = new Set<string>();
  let archive: Record<string, Uint8Array>;
  try {
  archive = unzipSync(bytes, { filter(entry) {
    if (entry.name.endsWith('/')) return false;
    validatePath(entry.name);
    if (ignored(entry.name)) return false;
    if (names.has(entry.name)) throw new UploadError('El ZIP contiene rutas repetidas.');
    names.add(entry.name);
    if (++count > MAX_FILES || entry.originalSize > MAX_FILE || (total += entry.originalSize) > MAX_EXPANDED) {
      throw new UploadError('El ZIP admite hasta 500 archivos, 512 KB por archivo y 8 MB descomprimidos.');
    }
    return true;
  }});
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError('No se pudo leer el ZIP. Verificá que sea válido y que no esté cifrado.');
  }
  let entries = Object.entries(archive);
  if (!entries.length) throw new UploadError('El ZIP está vacío o no contiene archivos publicables.');
  // Strip a wrapper directory, including exports such as project/dist/index.html.
  while (entries.every(([path]) => path.includes('/') && path.split('/')[0] === entries[0][0].split('/')[0])) {
    entries = entries.map(([path, data]) => [path.slice(path.indexOf('/') + 1), data]);
  }
  if (!entries.some(([path]) => /^index\.html?$/.test(path))) throw new UploadError('El ZIP debe incluir index.html en la raíz del sitio. Subí el contenido de dist o build.');
  return entries.map(([path, data]) => {
    if (data.length > MAX_FILE) throw new UploadError('Un archivo supera el límite de 512 KB.');
    const extension = path.split('.').pop()!.toLowerCase();
    const mime = mimeTypes[extension];
    if (!mime) throw new UploadError(`Formato no admitido: ${path}. Subí solamente los archivos estáticos de la web.`);
    return { route: '/' + path, content: PREFIX + JSON.stringify({ mime, data: Buffer.from(data).toString('base64') }) };
  });
}
export function parseLegacyPages(input: unknown, setAsMain: boolean): DeployFile[] {
  if (typeof input !== 'string' || Buffer.byteLength(input) > MAX_UPLOAD) throw new UploadError('Los HTML no pueden superar 3 MB en total.');
  let pages;
  try { pages = JSON.parse(input); } catch { throw new UploadError('No se pudieron leer los archivos HTML.'); }
  if (!Array.isArray(pages) || !pages.length || pages.length > MAX_FILES) throw new UploadError('Subí entre 1 y 500 archivos HTML.');
  const routes = new Set<string>();
  return pages.map(page => {
    if (typeof page.route !== 'string' || typeof page.content !== 'string' || page.content.startsWith(PREFIX) || Buffer.byteLength(page.content) > MAX_FILE) throw new UploadError('Archivo HTML inválido o mayor a 512 KB.');
    const route = setAsMain && pages.length === 1 ? '/' : page.route;
    if (route !== '/') validatePath(route.slice(1));
    if (!route.startsWith('/') || routes.has(route)) throw new UploadError('Hay rutas inválidas o repetidas.');
    routes.add(route);
    return { route, content: page.content };
  });
}
export function decodeContent(content: string) {
  if (!content.startsWith(PREFIX)) return { body: content, mime: 'text/html; charset=utf-8' };
  const asset = JSON.parse(content.slice(PREFIX.length));
  return { body: new Uint8Array(Buffer.from(asset.data, 'base64')), mime: asset.mime as string };
}
export function routeCandidates(path: string) {
  const route = '/' + path;
  return [...new Set([route, route.replace(/\/$/, '') + '/index.html', route.replace(/\/$/, '') + '/index.htm', ...(!path.endsWith('/') ? [route + '.html', route + '.htm'] : [])])];
}


