export default function noop() {
  return {
    // eslint-disable-next-line no-empty-function
    async dispatch() {},
  };
}
