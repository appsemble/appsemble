import { type Remapper } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Messages {
    /**
     * The error message that should be shown when video failed to load.
     */
    loadErrorMessage: never;
  }

  interface EventListeners {
    /**
     * The event to listen on for new data.
     *
     * The result must be either a video URL or an object containing a property `url`.
     */
    onVideo: never;
  }

  interface Actions {
    /**
     * The action that is dispatched when the video has finished playing.
     */
    onFinish: never;
  }

  interface Parameters {
    /**
     * The URL of the video.
     *
     * Note that this is ignored if the onVideo event listener is set.
     */
    url?: Remapper;

    /**
     * Whether the video should autoplay.
     *
     * Note that this does not work on every platform due to platform restrictions.
     */
    autoplay?: boolean;

    /**
     * The volume in percentages the video should default to.
     *
     * @maximum 100
     * @minimum 0
     */
    volume?: number;

    /**
     * Whether the player should default to being muted.
     */
    muted?: boolean;

    /**
     * The width of the player.
     */
    width?: string;

    /**
     * The height of the player.
     */
    height?: string;

    /**
     * The max width of the player.
     */
    maxWidth?: string;

    /**
     * The max height of the player.
     */
    maxHeight?: string;

    /**
     * If defined, the subtitle track to enable by default.
     */
    subtitles?: Remapper;
  }
}
