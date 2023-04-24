import { type Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * The event to listen on for new data.
     *
     * The result must be either a audio URL or an object containing a property `url`.
     */
    onAudio: never;

    /**
     * The event to stop listening to audio.
     *
     */
    stop: never;
  }

  interface Parameters {
    /**
     * The source of the player.
     * This can either be a URL pointing to a website, or it can point to an asset.
     * The asset can either be the object, or the ID of the asset
     *
     */
    src?: Remapper;
  }
}
