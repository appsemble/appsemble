/**
 * Create a snippet of JavaScript code to initialize Google Analytics.
 *
 * @param id The Google Analytics ID to generate the gtag code for.
 * @returns The code to initialize Google Analytics.
 */
export function createGtagCode(id: string): string[] {
  return [
    'window.dataLayer=window.dataLayer||[]',
    'function gtag(){dataLayer.push(arguments)}',
    'gtag("js",new Date)',
    `gtag("config",${JSON.stringify(id)})`,
  ];
}
