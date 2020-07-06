import type { BulmaColor } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';

interface AbstractMarkerIcon {
  /**
   * The anchor X and Y offset used for positioning the image.
   *
   * By default, the center of the icon will be used to mark the location. For many icons, it may
   * be desirable to customize this. For example, for a symmetric pin which has a width of 10, and a
   * height of 16, you’ll probably want to set this to `[5, 16]`
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

  /**
   * Enlarge an active marker with this ratio.
   *
   * This modifier is applied if a marker matches the block data which may be received by the block
   * context. For example, this is applied if a marker matches the data that was passed in from a
   * link action.
   *
   * @default 1
   */
  activeRatio?: number;
}

/**
 * A marker based on a [Font Awesome icon](https://fontawesome.com/icons?m=free).
 */
interface FontAwesomeMarkerIcon extends AbstractMarkerIcon {
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
interface AssetMarkerIcon extends AbstractMarkerIcon {
  /**
   * The id of an asset to use.
   */
  asset: number;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The name of the field used to retrieve the longitude
     */
    latitude: string;

    /**
     * The name of the field used to retrieve the latitude
     */
    longitude: string;

    /**
     * The location (latitude, longitude) to default to when the user’s location cannot be found.
     *
     * This can be used to set the location to something that is more relevant to the user.
     *
     * @default [51.476852, 0]
     */
    defaultLocation?: [number, number];

    /**
     * Whether clustering should be disabled.
     *
     * By default markers are clustered if they are too close to each other.
     */
    disableClustering?: boolean;

    /**
     * Custom icon configuration.
     */
    icons?: FontAwesomeMarkerIcon | AssetMarkerIcon;

    /**
     * The maximum radius that a cluster will cover from the central marker (in pixels).
     *
     * Decreasing will make more, smaller clusters. One can also use a function that accepts the
     * current map zoom and returns the maximum cluster radius in pixels.
     *
     * @default 80
     * @minimum 1
     * @TJS-type integer
     */
    maxClusterRadius?: number;
  }

  interface Actions {
    /**
     * Action that gets dispatched when a marker is clicked.
     */
    onMarkerClick: {};
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed. Must be a set of data.
     */
    data: {};
  }

  interface EventEmitters {
    /**
     * Event that gets emitted when moving the map around.
     *
     * Will apply [OData filters](https://www.odata.org) to limit the range of items fetched. This
     * will be skipped if the move emit event is not defined.
     */
    move: {};
  }
}
