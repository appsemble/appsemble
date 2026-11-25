/**
 * Check whether a stored credential lacks a value.
 *
 * An incomplete credential keeps its configuration, but can't be used until a value is set.
 *
 * @param value The stored credential.
 * @returns Whether the credential has no value.
 */
export function isSecretIncomplete(value?: Buffer | string | null): boolean {
  return !value?.length;
}
