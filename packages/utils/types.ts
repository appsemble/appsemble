// https://stackoverflow.com/a/76233473
export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    function supportedValuesOf(value: string): string[];
  }
}
