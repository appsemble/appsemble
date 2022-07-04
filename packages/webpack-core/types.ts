// https://github.com/puppeteer/puppeteer/pull/6998
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Document {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Element {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
  interface NodeListOf<TNode> {}
}

export {};
