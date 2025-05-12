import { convertToCsv } from '@appsemble/utils';
import { type Context } from 'koa';
import { bufferParser, jsonParser, bodyParser as koaBodyParser } from 'koas-body-parser';
import { type Plugin } from 'koas-core';
import { serializer as koaSerializer } from 'koas-serializer';

import { csvParser, streamParser, xWwwFormUrlencodedParser } from './parsers.js';

function serializer(): Plugin {
  return koaSerializer({
    serializers: {
      'application/scim+json': (body) => JSON.stringify(body),
      // @ts-expect-error 2322 unknown is not assignable to type string (strictNullChecks)
      'application/xml': (body: string) => body,
      'text/csv': convertToCsv,
    },
  });
}

function bodyParser(): Plugin {
  return koaBodyParser({
    ignore: ['acceptPayment'],
    parsers: {
      'application/scim+json': jsonParser,
      'application/x-www-form-urlencoded': xWwwFormUrlencodedParser,
      'text/csv': csvParser,
      'multipart/form-data': streamParser,
      '*/*': bufferParser,
    },
  });
}

export { bodyParser, serializer };
export * from 'koas-parameters';
export * from 'koas-security';

const errorStatusMap = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'Uri Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: 'Im A Teapot',
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'Http Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
} as const;

type HttpErrorCodes = keyof typeof errorStatusMap;

/**
 * Throw standard Koa error response.
 *
 * @param ctx The Koa context used to throw the error response.
 * @param status The HTTP status code to use.
 * @param message The message for in the response body.
 * @param data Optional data to include.
 */
export function throwKoaError(
  ctx: Context,
  status: HttpErrorCodes,
  message?: string,
  data?: Record<string, any>,
): never {
  ctx.response.status = status;
  ctx.response.body = {
    error: errorStatusMap[status],
    message: message || errorStatusMap[status],
    statusCode: status,
    data,
  };
  ctx.throw();
}

/**
 * Throw standard Koa error response when condition is met.
 *
 * @param condition The condition to check.
 * @param ctx The Koa context used to throw the error response.
 * @param status The HTTP status code to use.
 * @param message The message for in the response body.
 * @param data Optional data to include.
 */
export function assertKoaError(
  condition: boolean,
  ctx: Context,
  status: HttpErrorCodes,
  message?: string,
  data?: Record<string, any>,
): void {
  if (condition) {
    throwKoaError(ctx, status, message, data);
  }
}

/**
 * Throws standard Koa error response when condition is _not_ met.
 * Does the opposite of `assertKoaError`.
 *
 * @param condition The condition to check.
 * @param ctx The Koa context used to throw the error response.
 * @param status The HTTP status code to use.
 * @param message The message for in the response body.
 * @param data Optional data to include.
 * @see throwKoaError
 */
export function assertKoaCondition(
  condition: boolean,
  ctx: Context,
  status: HttpErrorCodes,
  message?: string,
  data?: Record<string, any>,
): asserts condition {
  assertKoaError(!condition, ctx, status, message, data);
}
