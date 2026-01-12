import { Elysia } from "elysia";
import { account, authCookieName, authCookieOptions, login, logout, register } from "../modules/auth.js";
import { listUsers } from "../modules/cli.js";
import { errorHandler, notFound, send } from "../middlewares/error-handler.js";
import { appendSetCookie, parseCookies, serializeCookie } from "../utils/cookies.js";

export const clientApi = new Elysia({ name: "client-api" })
  .use(errorHandler)
  .post("/register", async ({ body, set }) => {
    const res = await register({
      username: body?.username,
      email: body?.email,
      password: body?.password,
    });
    set.status = res.status;
    return res.body;
  })
  .post("/login", async ({ body, set, request }) => {
    const res = await login({ email: body?.email, password: body?.password });
    if (res.ok && res.body?.token) {
      const cookie = serializeCookie(authCookieName(), res.body.token, authCookieOptions());
      appendSetCookie(set, cookie);
    }
    set.status = res.status;
    return res.body;
  })
  .post("/logout", async ({ set, request }) => {
    const cookies = parseCookies(request.headers.get("cookie"));
    const token = cookies?.[authCookieName()];
    const res = await logout({ token });

    const cookie = serializeCookie(authCookieName(), "", {
      ...authCookieOptions(),
      maxAge: 0,
    });
    appendSetCookie(set, cookie);

    set.status = res.status;
    return res.body;
  })
  .get("/account", async ({ request, set }) => {
    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await account({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });
    set.status = res.status;
    return res.body;
  })
  .get("/users", async ({ request, set }) => {
    const cookies = parseCookies(request.headers.get("cookie"));
    const res = await listUsers({
      authorization: request.headers.get("authorization"),
      cookieToken: cookies?.[authCookieName()],
    });
    set.status = res.status;
    return res.body;
  })
  .all("*", ({ set }) => send(set, notFound("not_found")));
