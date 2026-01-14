import { Elysia } from "elysia";
import { account, authCookieName, authCookieOptions, login, logout, register } from "../modules/auth.js";
import { errorHandler, forbidden, notFound, ok, send, unprocessable } from "../middlewares/error-handler.js";
import { checkAuthRateLimit, checkRateLimit } from "../middlewares/rate-limit.js";
import { authLogger, getLogger } from "../middlewares/logger.js";
import { appendSetCookie, parseCookies, serializeCookie } from "../utils/cookies.js";
import { getBalance, getEconomySettings, setCurrencyName } from "../utils/economy.js";
import { deleteImportedNest, importNestToDb, listImportedNests, listNests } from "../modules/nests.js";
import { deleteImportedLocation, importLocationToDb, listImportedLocations, listLocations } from "../modules/locations.js";
import { createServer, deleteServer, editServer, getServerWebsocket, listUserServers } from "../modules/server.js";
import { getServerDefaults, updateServerDefaults } from "../utils/configuration.js";

const wsLogger = getLogger('ws');

export const clientApi = new Elysia({ name: "client-api" })
  .use(errorHandler)
  .post("/register", async ({ body, set, request }) => {
    const limited = checkAuthRateLimit({ request, set });
    if (limited) return limited;

    const res = await register({
      username: body?.username,
      email: body?.email,
      password: body?.password,
    });

    authLogger.info('register', {
      meta: {
        ok: res.ok,
        status: res.status,
        email: body?.email,
        username: body?.username,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      }
    });

    set.status = res.status;
    return res.body;
  })
  .post("/login", async ({ body, set, request }) => {
    const limited = checkAuthRateLimit({ request, set });
    if (limited) return limited;

    const res = await login({ email: body?.email, password: body?.password });
    if (res.ok && res.body?.token) {
      const cookie = serializeCookie(authCookieName(), res.body.token, authCookieOptions());
      appendSetCookie(set, cookie);
    }

    authLogger.info('login', {
      meta: {
        ok: res.ok,
        status: res.status,
        userId: res.body?.user?.id ?? null,
        email: body?.email,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      }
    });

    set.status = res.status;
    return res.body;
  })
  .post("/logout", async ({ set, request }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const token = cookies?.[authCookieName()];
    const res = await logout({ token });

    const cookie = serializeCookie(authCookieName(), "", {
      ...authCookieOptions(),
      maxAge: 0,
    });
    appendSetCookie(set, cookie);

    authLogger.info('logout', {
      meta: {
        ok: res.ok,
        status: res.status,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      }
    });

    set.status = res.status;
    return res.body;
  })
  .get("/account", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const userId = res.body?.user?.id;
    const wallet = await getBalance(userId);
    const out = ok({ user: res.body.user, ...wallet }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/balance", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const userId = res.body?.user?.id;
    const data = await getBalance(userId);
    const out = ok({ ...data }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/admin/economy", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const settings = await getEconomySettings();
    const out = ok({ ...settings }, 200);
    set.status = out.status;
    return out.body;
  })
  .patch("/admin/economy", async ({ request, set, body }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const updated = await setCurrencyName(body?.currencyName);
    if (!updated.ok) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    const out = ok({ currencyName: updated.currencyName }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/admin/server-defaults", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const defaults = await getServerDefaults();
    const out = ok({ defaults }, 200);
    set.status = out.status;
    return out.body;
  })
  .patch("/admin/update-defaults", async ({ request, set, body }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const updated = await updateServerDefaults(body || {});
    const out = ok({ ...updated }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/admin/panel-nests", async ({ request, set, query }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const page = Number(query?.page ?? 1);
    const perPage = Number(query?.perPage ?? query?.per_page ?? 50);
    const data = await listNests({
      page: Number.isInteger(page) && page > 0 ? page : 1,
      perPage: Number.isInteger(perPage) && perPage > 0 && perPage <= 100 ? perPage : 50
    });

    const out = ok({ ...data }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/admin/imported-nests", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const nests = await listImportedNests();
    const out = ok({ nests }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/nests", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const nests = await listImportedNests();
    const out = ok({ nests }, 200);
    set.status = out.status;
    return out.body;
  })
  .delete("/admin/delete-nest", async ({ request, set, body, query }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const nestId = Number(body?.id ?? query?.id);
    if (!Number.isInteger(nestId) || nestId <= 0) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    const deleted = await deleteImportedNest({ nestId });
    const out = ok({ ...deleted }, 200);
    set.status = out.status;
    return out.body;
  })
  .post("/admin/add-nest", async ({ request, set, body }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const nestId = Number(body?.id);
    if (!Number.isInteger(nestId) || nestId <= 0) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    const imported = await importNestToDb({ nestId });
    const out = ok({ ...imported }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/admin/panel-locations", async ({ request, set, query }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const page = Number(query?.page ?? 1);
    const perPage = Number(query?.perPage ?? query?.per_page ?? 50);
    const data = await listLocations({
      page: Number.isInteger(page) && page > 0 ? page : 1,
      perPage: Number.isInteger(perPage) && perPage > 0 && perPage <= 100 ? perPage : 50
    });

    const out = ok({ ...data }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/admin/imported-locations", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const locations = await listImportedLocations();
    const out = ok({ locations }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/default-resources", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const defaults = await getServerDefaults();
    const out = ok({ defaults }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/locations", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const locations = await listImportedLocations();
    const out = ok({ locations }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/servers", async ({ request, set }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const servers = await listUserServers({ userId: res.body.user.id });
    const out = ok({ servers }, 200);
    set.status = out.status;
    return out.body;
  })
  .get("/servers/:id/websocket", async ({ request, set, params }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const id = Number(params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    try {
      const ws = await getServerWebsocket({ userId: res.body.user.id, serverId: id });
      wsLogger.info('server_websocket_credentials_ok', { meta: { userId: res.body.user.id, serverId: id } });
      const out = ok({ ...ws }, 200);
      set.status = out.status;
      return out.body;
    } catch (err) {
      wsLogger.error('server_websocket_credentials_failed', { meta: { userId: res.body.user.id, serverId: id, error: err?.message, status: err?.status } });
      if (err?.status) set.status = err.status;
      else set.status = 500;
      return { error: err?.message || 'websocket_failed' };
    }
  })
  .post("/create-server", async ({ request, set, body }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const created = await createServer({
      userId: res.body.user.id,
      userEmail: res.body.user.email,
      name: body?.name,
      description: body?.description,
      locationId: body?.locationId,
      eggId: body?.eggId,
      dockerImage: body?.dockerImage,
      startup: body?.startup,
      nestId: body?.nestId
    });

    const out = ok({ server: created.local, panel: created.panel }, 200);
    set.status = out.status;
    return out.body;
  })
  .patch("/edit-server", async ({ request, set, body, query }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const id = Number(body?.id ?? query?.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    const updated = await editServer({ userId: res.body.user.id, id, name: body?.name, description: body?.description });
    const out = ok({ server: updated }, 200);
    set.status = out.status;
    return out.body;
  })
  .delete("/delete-server", async ({ request, set, body, query }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    const id = Number(body?.id ?? query?.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    const deleted = await deleteServer({ userId: res.body.user.id, id });
    const out = ok({ server: deleted }, 200);
    set.status = out.status;
    return out.body;
  })
  .delete("/admin/delete-location", async ({ request, set, body, query }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const locationId = Number(body?.id ?? query?.id);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    const deleted = await deleteImportedLocation({ locationId });
    const out = ok({ ...deleted }, 200);
    set.status = out.status;
    return out.body;
  })
  .post("/admin/add-locations", async ({ request, set, body }) => {
    const limited = checkRateLimit({ request, set });
    if (limited) return limited;

    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });

    if (!res.ok) {
      set.status = res.status;
      return res.body;
    }

    if (!res.body?.user?.isAdmin) {
      set.status = 403;
      return forbidden('forbidden').body;
    }

    const locationId = Number(body?.id);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      set.status = 422;
      return unprocessable('validation_error').body;
    }

    const imported = await importLocationToDb({ locationId });
    const out = ok({ ...imported }, 200);
    set.status = out.status;
    return out.body;
  })
  .all("*", ({ set }) => send(set, notFound("not_found")));
