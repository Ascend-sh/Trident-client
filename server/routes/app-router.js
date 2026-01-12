import { Elysia } from 'elysia';
import { clientApi } from '../utils/client-api.js';
import { notFound, send } from '../middlewares/error-handler.js';

export const appRouter = new Elysia({ name: 'app-router' })
  .group('/api/v1/client', app =>
    app
      .use(clientApi)
      .all('*', ({ set }) => send(set, notFound('not_found')))
  );
