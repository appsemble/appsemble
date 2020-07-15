import type { BulmaColor, Remapper } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';

interface Reply {
  /**
   * The field that is used to associate the ID of the resource this reply belongs to.
   */
  parentId?: string;

  /**
   * The field that is used to fetch the name of the author.
   *
   * @default [{ prop: 'author' }]
   */
  author?: Remapper;

  /**
   * The field that is used to read the content of the reply.
   *
   * @default [{ prop: 'content' }]
   */
  content?: Remapper;
}

/**
 * A marker based on a [Font Awesome icon](https://fontawesome.com/icons?m=free).
 */
interface FontAwesomeMarkerIcon {
  /**
   * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to use.
   */
  icon?: IconName;

  /**
   * The color to apply to the icon.
   *
   * @default primary
   */
  color?: BulmaColor;
}

/**
 * A marker based on an existing asset.
 */
interface AssetMarkerIcon {
  /**
   * The id of an asset to use.
   */
  asset: number;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The text that displays inside the button.
     */
    buttonLabel?: string;

    /**
     * The definition used to display replies.
     */
    reply?: Reply;

    /**
     * The base URL used to display pictures.
     *
     * If not defined, the Asset API will be used instead.
     */
    pictureBase?: string;

    /**
     * The title displayed on the card.
     */
    title?: Remapper;

    /**
     * The subtitle displayed on the card.
     */
    subtitle?: Remapper;

    /**
     * The heading displayed on the card.
     */
    heading?: Remapper;

    /**
     * The highlighted picture.
     */
    picture?: Remapper;

    /**
     * A list of pictures that are displayed below the highlighted picture.
     */
    pictures?: Remapper;

    /**
     * The description or content of the card.
     */
    description?: Remapper;

    /**
     * The location marker that is displayed on the card.
     */
    marker?: {
      /**
       * The latitude of the marker.
       */
      latitude: Remapper;

      /**
       * The longitude of the marker.
       */
      longitude: Remapper;

      /**
       * The anchor X and Y offset used for positioning the image.
       *
       * By default, the center of the icon will be used to mark the location.
       * For many icons, it may be desirable to customize this. For example, for a symmetric pin
       * which has a width of 10, and a  height of 16, you’ll probably want to set this to `[5, 16]`
       *
       * The following special cases for [Font Awesome icon](https://fontawesome.com/icons?m=free) are
       * treated in a special way, since they are often used to represent a location:
       *
       * - `map-marker`
       * - `map-marker-alt`
       * - `map-pin`
       * - `thumbtrack`
       */
      anchor?: [number, number];

      /**
       * The height of marker icons in pixels.
       *
       * @default 28
       */
      size?: number;
    } & (FontAwesomeMarkerIcon | AssetMarkerIcon);
  }

  interface Actions {
    /**
     * Action that gets dispatched when a user clicks on an avatar.
     */
    onAvatarClick: any;

    /**
     * Action that gets dispatched when the button is clicked.
     *
     * The button won't display if this is not defined.
     */
    onButtonClick: any;

    /**
     * Action that gets dispatched when submitting a reply.
     */
    onSubmitReply: any;

    /**
     * Action to retrieve replies, dispatched on every feed item.
     */
    onLoadReply: any;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed.
     */
    data: {};
  }
}
