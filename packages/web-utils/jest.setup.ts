// https://github.com/jsdom/jsdom/issues/1612
Object.defineProperty(globalThis, 'crypto', {
  value: {
    /**
     * A cryptographically unsecure polyfill for `crypto.getRandomVlaues()`.
     *
     * Node crypto is unused, because node types shouldn’t be included in this module.
     */
    getRandomValues(arr: Uint8Array) {
      for (let i = 0; i < arr.length; i += 1) {
        // eslint-disable-next-line no-param-reassign
        arr[i] = Math.floor(Math.random() * 2 ** 8);
      }
    },
  },
});
