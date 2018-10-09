export default function mapValues(object, iteratee) {
  return Object.entries(object).reduce((acc, [key, value]) => {
    acc[key] = iteratee(value);
    return acc;
  }, {});
}
