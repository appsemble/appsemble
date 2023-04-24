import { type Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * Data that can be used to populate `content` with dynamic content.
     *
     * If defined, a loader will be shown until this event is triggered.
     */
    data: never;
  }

  interface Parameters {
    /**
     * A string containing the [markdown content](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) to display.
     */
    content: Remapper;

    /**
     * Whether or not the content should be centered.
     */
    centered?: boolean;

    /**
     * The alignment of the text content.
     *
     * @default 'left'
     */
    alignment?: 'center' | 'left' | 'right';
  }
}
