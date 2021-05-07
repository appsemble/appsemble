// https://github.com/puppeteer/puppeteer/pull/6998
declare global {
  type Document = unknown;

  type Element = unknown;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type NodeListOf<TNode> = unknown;
}

export {};
