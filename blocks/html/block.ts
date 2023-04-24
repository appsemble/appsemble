import { type Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface Actions {
    /**
     * Any custom action.
     * These can be used on `<button>`, `<a>`, and `<input>` elements using `data-click`.
     *
     * If no corresponding `data-click` attribute can be found
     * the action will be considered unused and invalid.
     */
    [any: string]: never;
  }

  interface EventListeners {
    /**
     * Data that can be used in the placeholder remappers.
     *
     * All elements specifying `data-content` will be updated each time this event is received.
     */
    data: never;
  }

  interface Parameters {
    /**
     * The HTML to render.
     */
    content: string;

    /**
     * The placeholders that are injected on elements with the `data-content` property.
     */
    placeholders?: Record<string, Remapper>;
  }
}
