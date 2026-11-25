export function mapValues<Input, Output>(
  object: Record<string, Input>,
  iteratee: (value: Input, key: string) => Output,
): Record<string, Output> {
  const result: Record<string, Output> = {};
  for (const [key, value] of Object.entries(object)) {
    result[key] = iteratee(value, key);
  }
  return result;
}
