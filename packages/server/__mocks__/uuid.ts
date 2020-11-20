let count = 0;

/**
 * Return an consistent uuid.
 *
 * @returns A consistend v4 compatible uuid.
 */
export function v4(): string {
  count += 1;
  return `00000000-0000-4000-aa00-${String(count).padStart(12, '0')}`;
}
