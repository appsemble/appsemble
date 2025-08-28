import { type BulmaColor, type IconName, type Remapper } from '@appsemble/sdk';

interface Reply {
  /**
   * The field that is used to associate the ID of the resource this reply belongs to.
   */
  parentId?: string;

  /**
   * The author of the reply.
   *
   * @default [{ prop: '$author' }, { prop: 'name' }]
   */
  author?: Remapper;

  /**
   * The content of the reply.
   *
   * @default { prop: 'content' }
   */
  content?: Remapper;
}

interface BaseMarkerIcon {
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
}

/**
 * A marker based on a [Font Awesome icon](https://fontawesome.com/icons?m=free).
 */
interface FontAwesomeMarkerIcon extends BaseMarkerIcon {
  /**
   * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to use.
   */
  icon?: IconName;

  /**
   * The color to apply to the icon.
   *
   * @default 'primary'
   */
  color?: BulmaColor;
}

/**
 * A marker based on an existing asset.
 */
interface AssetMarkerIcon extends BaseMarkerIcon {
  /**
   * The id of an asset to use.
   */
  asset: string;
}

export interface Dropdown {
  /**
   * The text to show in the dropdown button.
   */
  label?: Remapper;

  /**
   * The icon to show in the dropdown button.
   */
  icon?: IconName;

  /**
   * The list of options to display. Must have at least 1 option.
   *
   * @minItems 1
   */
  options: DropdownOption[];
}

export interface DropdownOption {
  /**
   * The text to show in the option.
   */
  label?: Remapper;

  /**
   * The icon to show in the option.
   */
  icon?: IconName;

  /**
   * The action that will be called when selecting this option.
   *
   * @format action
   */
  onClick: string;
}

declare module '@appsemble/sdk' {
  interface Messages {
    /**
     * The name to display for replies without known user names.
     */
    anonymousLabel: never;

    /**
     * The error message shown when an error occurs while submitting a reply.
     */
    replyErrorMessage: never;

    /**
     * The placeholder text used for the reply input.
     */
    replyLabel: never;

    /**
     * The label that’s displayed when there are no feed items available.
     */
    emptyLabel: never;
  }

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
     * The dropdown menu displayed in the header of the card.
     */
    dropdown?: Dropdown;

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
    marker?: AssetMarkerIcon | FontAwesomeMarkerIcon;
  }

  interface Actions {
    /**
     * Action that gets dispatched when a user clicks on an avatar.
     */
    onAvatarClick: never;

    /**
     * Action that gets dispatched when the button is clicked.
     *
     * The button won't display if this is not defined.
     */
    onButtonClick: never;

    /**
     * Action that gets dispatched when submitting a reply.
     *
     * When submitting replies, the data will be structured
     * as an object containing `parentId` and `content`.
     */
    onSubmitReply: never;

    /**
     * Action to retrieve replies, dispatched on every feed item.
     */
    onLoadReply: never;

    /**
     * Custom action mapping.
     */
    [key: string]: never;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed.
     */
    data: never;
  }
}
