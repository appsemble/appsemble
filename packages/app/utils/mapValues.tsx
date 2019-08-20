export default function mapValues<I, O>(
  object: Record<string, I>,
  iteratee: (value: I) => O,
): Record<string, O> {
  return Object.entries(object).reduce<Record<string, O>>((acc, [key, value]) => {
    acc[key] = iteratee(value);
    return acc;
  }, {});
}
