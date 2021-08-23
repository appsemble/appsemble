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
     * This asset will be used to render an image.
     *
     * This takes precedence over an icon.
     */
    asset?: Remapper;

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
