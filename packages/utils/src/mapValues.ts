export function mapValues<Input, Output>(
  object: { [key: string]: Input },
  iteratee: (value: Input) => Output,
): { [key: string]: Output } {
  return Object.entries(object).reduce<{ [key: string]: Output }>((acc, [key, value]) => {
    acc[key] = iteratee(value);
    return acc;
  }, {});
}
