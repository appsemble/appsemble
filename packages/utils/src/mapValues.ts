export function mapValues<Input, Output>(
  object: Record<string, Input>,
  iteratee: (value: Input) => Output,
): Record<string, Output> {
  return Object.entries(object).reduce<Record<string, Output>>((acc, [key, value]) => {
    acc[key] = iteratee(value);
    return acc;
  }, {});
}
