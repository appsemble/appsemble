export default function mapValues<I, O>(
  object: { [key: string]: I },
  iteratee: (value: I) => O,
): { [key: string]: O } {
  return Object.entries(object).reduce<{ [key: string]: O }>((acc, [key, value]) => {
    acc[key] = iteratee(value);
    return acc;
  }, {});
}
