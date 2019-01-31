export default function log(definition) {
  const { level = 'info' } = definition;

  return {
    dispatch(...args) {
      // eslint-disable-next-line no-console
      console[level](...args);
    },
    level,
  };
}
