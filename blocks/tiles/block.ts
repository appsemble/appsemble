import { Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * This action is triggered when a tile is clicked.
     */
    onClick: never;
  }

  interface EventListeners {
    /**
     * On what event to listen for incoming data to display.
     */
    data: never;
  }

  interface Parameters {
    /**
     * This can be used to render an image.
     * This can be either an asset ID or name, or a full URL.
     *
     * This takes precedence over an icon.
     */
    image?: Remapper;

    /**
     * The [Font Awesome icon](https://fontawesome.com/icons?m=free) to render.
     *
     * This is ignored if an asset can be resolved.
     */
    icon?: Remapper;

    /**
     * The label to render.
     */
    text?: Remapper;

    /**
     * This color is used to fill the background of the tile.
     *
     * Takes either a hex color or a [Bulma color](https://bulma.io/documentation/helpers/color-helpers)
     */
    color?: Remapper;
  }

  interface Messages {
    /**
     * This message is displayed if there was a problem loading the message.
     */
    loadError: never;
  }
}
