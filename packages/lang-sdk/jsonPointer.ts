// From https://gitlab.com/remcohaszing/koas/-/blob/main/packages/koas-core/src/jsonRefs.ts

/**
 * Escape a JSON pointer segment.
 *
 * See https://tools.ietf.org/html/rfc6901#section-3
 *
 * @param pointer THe JSON pointer segment to escape.
 * @returns The escaped JSON pointer segment.
 */
export function escapeJsonPointer(pointer: string): string {
  return pointer.replaceAll('~', '~0').replaceAll('/', '~1');
}

/**
 * Unescape a JSON pointer segment.
 *
 * See https://tools.ietf.org/html/rfc6901#section-3
 *
 * @param pointer The JSON pointer segment to unescape
 * @returns The unescaped JSON pointer segment.
 */
export function unescapeJsonPointer(pointer: string): string {
  return pointer.replaceAll('~1', '/').replaceAll('~0', '~');
}
