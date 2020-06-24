export {};

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * A string containing the [markdown content](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) to display.
     */
    content: string;
  }
}
