/**
 * The SCIM protocol uses the HTTP response status codes defined in
 * [Section 6 of [RFC7231]](https://datatracker.ietf.org/doc/html/rfc7231#section-6) to indicate
 * operation success or failure. In addition to returning an HTTP response code, implementers
 * **MUST** return the errors in the body of the response in a JSON format, using the attributes
 * described below. Error responses are identified using the following "schema" URI:
 * `"urn:ietf:params:scim:api:messages:2.0:Error"`.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7644#section-3.12
 */
export class SCIMError extends Error {
  schemas = ['urn:ietf:params:scim:api:messages:2.0:Error'];

  /**
   * The HTTP status code (see
   * [Section 6 of [RFC7231]](https://datatracker.ietf.org/doc/html/rfc7231#section-6)) expressed as
   * a JSON string.
   */
  status: string;

  /**
   * A detailed human-readable message.
   */
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.detail = detail;
    this.name = 'SCIMError';
    this.status = String(status);
  }

  toJSON(): Pick<SCIMError, 'detail' | 'schemas' | 'status'> {
    return {
      detail: this.detail,
      schemas: this.schemas,
      status: this.status,
    };
  }
}

export function scimAssert(condition: unknown, status: number, detail: string): asserts condition {
  if (!condition) {
    throw new SCIMError(status, detail);
  }
}
