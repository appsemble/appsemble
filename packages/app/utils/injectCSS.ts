/**
 * Inject CSS into a root node using using a `link` tag.
 *
 * @param parent The parent node to insert the CSS into. I.e. a shadow root.
 * @param url The URL of the stylesheet to insert.
 */
export async function injectCSS(parent: DocumentFragment, url?: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (!url) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    // Make sure all CSS is loaded before resolving.
    link.addEventListener('load', () => resolve(), {
      capture: true,
      once: true,
      passive: true,
    });
    link.addEventListener('error', () => reject(new Error(`Failed to load stylesheet: ${url}`)), {
      once: true,
    });
    link.href = url;
    link.rel = 'stylesheet';
    parent.append(link);
  });
}
