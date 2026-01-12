import { Elysia } from 'elysia';

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502
});

export function ok(body = {}, status = HTTP_STATUS.OK) {
  return { ok: true, status, body: { ok: true, ...body } };
}

export function fail(error, status = HTTP_STATUS.INTERNAL_SERVER_ERROR, extra = {}) {
  return { ok: false, status, body: { ok: false, error, ...extra } };
}

export const badRequest = (error = 'bad_request', extra) => fail(error, HTTP_STATUS.BAD_REQUEST, extra);
export const unauthorized = (error = 'unauthorized', extra) => fail(error, HTTP_STATUS.UNAUTHORIZED, extra);
export const forbidden = (error = 'forbidden', extra) => fail(error, HTTP_STATUS.FORBIDDEN, extra);
export const notFound = (error = 'not_found', extra) => fail(error, HTTP_STATUS.NOT_FOUND, extra);
export const unprocessable = (error = 'validation_error', extra) => fail(error, HTTP_STATUS.UNPROCESSABLE_ENTITY, extra);
export const tooManyRequests = (error = 'rate_limited', extra) => fail(error, HTTP_STATUS.TOO_MANY_REQUESTS, extra);
export const internalError = (error = 'internal_server_error', extra) => fail(error, HTTP_STATUS.INTERNAL_SERVER_ERROR, extra);
export const badGateway = (error = 'bad_gateway', extra) => fail(error, HTTP_STATUS.BAD_GATEWAY, extra);

export function send(set, res) {
  if (set && typeof set === 'object') set.status = res.status;
  return res.body;
}

function isHttpStatus(value) {
  return Number.isInteger(value) && value >= 100 && value <= 599;
}

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(({ code, error, set }) => {
  if (code === 'NOT_FOUND') {
    return send(set, notFound('not_found'));
  }

  if (code === 'VALIDATION') {
    const details =
      typeof error?.all === 'function'
        ? error.all()
        : error?.message
          ? [{ message: error.message }]
          : undefined;

    return send(set, unprocessable('validation_error', details ? { details } : undefined));
  }

  const status = isHttpStatus(error?.status) ? error.status : isHttpStatus(error?.statusCode) ? error.statusCode : null;

  if (status) {
    const errCode = typeof error?.error === 'string' && error.error ? error.error : 'request_failed';
    const extra = error?.details ? { details: error.details } : error?.payload ? { payload: error.payload } : undefined;
    return send(set, fail(errCode, status, extra ?? {}));
  }

  return send(set, internalError('internal_server_error'));
});
