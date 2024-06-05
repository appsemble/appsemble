import { type Context } from 'koa';

/**
 * The SCIM protocol uses the HTTP response status codes defined in
 * [Section 6 of [RFC7231]](https://datatracker.ietf.org/doc/html/rfc7231#section-6) to indicate
 * operation success or failure.
 *
 * In addition to returning an HTTP response code, implementers
 * **MUST** return the errors in the body of the response in a JSON format, using the attributes
 * described below.
 *
 * Error responses are identified using the following "schema" URI:
 * `"urn:ietf:params:scim:api:messages:2.0:Error"`.
 *
 * @param condition The condition to check.
 * @param ctx The Koa context used to throw the error response.
 * @param status The HTTP status code (see [Section 6 of [RFC7231]](https://datatracker.ietf.org/doc/html/rfc7231#section-6)) expressed as a JSON string.
 * @param detail A detailed human-readable message.
 * @see https://datatracker.ietf.org/doc/html/rfc7644#section-3.12
 */
export function scimAssert(
  condition: unknown,
  ctx: Context,
  status: number,
  detail: string,
): asserts condition {
  if (!condition) {
    ctx.status = status;
    ctx.body = {
      detail,
      schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
      status,
    };
    ctx.throw();
  }
}
