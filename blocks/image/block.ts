import { Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * What happens if the button is clicked.
     */
    onClick: never;
  }
  interface Parameters {
    /**
     * The URL of the image.
     *
     * Note that this is ignored if the onImage event listener is set.
     */
    url: Remapper;

    /**
     * The ALT text of the image.
     *
     */
    alt?: Remapper;

    /**
     * Is image rounded.
     *
     */
    rounded?: boolean;

    /**
     * The alignment of the text content.
     *
     * @default 'left'
     */
    alignment?: 'center' | 'left' | 'right';
  }
}

export {};
