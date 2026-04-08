import { Elysia } from 'elysia';
import { existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { appRouter } from './routes/app-router.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';

const port = Number(process.env.PORT ?? 3000);
const distDir = join(process.cwd(), 'client', 'dist');
const distIndex = join(distDir, 'index.html');
const hasDist = existsSync(distIndex);

function fileFromDist(urlPath) {
  const clean = String(urlPath ?? '/').split('?')[0].split('#')[0];
  const rel = clean === '/' ? 'index.html' : clean.replace(/^\//, '');
  const abs = normalize(join(distDir, rel));
  if (!abs.startsWith(distDir)) return null;
  if (!existsSync(abs)) return null;
  return Bun.file(abs);
}

const app = new Elysia()
  .use(errorHandler)
  .use(appRouter)
  .get('/health', () => ({ ok: true, name: 'Trident', ts: Date.now() }))
  .get('/', () => {
    if (hasDist) return Bun.file(distIndex);
    return { message: 'Trident API', docs: '/health' };
  })
  .get('*', ({ request, set }) => {
    if (!hasDist) {
      const res = notFound('not_found');
      set.status = res.status;
      return res.body;
    }

    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      const res = notFound('not_found');
      set.status = res.status;
      return res.body;
    }

    const file = fileFromDist(pathname);
    if (file) return file;

    if (existsSync(distIndex)) return Bun.file(distIndex);

    const res = notFound('not_found');
    set.status = res.status;
    return res.body;
  })
  .listen({ hostname: '0.0.0.0', port });

console.log(`Trident server listening on http://localhost:${app.server?.port}`);
