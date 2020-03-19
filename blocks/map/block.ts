import { IconName } from '@fortawesome/fontawesome-common-types';

interface AbstractMarkerIcon {
  /**
   * The anchor X and Y offset used for positioning the image.
   *
   * By default, the center of the icon will be used to mark the location. For many icons, it may
   * be desirable to customize this. For example, for a symmetric pin which has a width of 10, and a
   * height of 16, you’ll probably want to set this to `[5, 16]`
   *
   * The following special cases for Font Awesome icons are treated in a special way, since they are
   * often used to represent a location:
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

interface FontAwesomeMarkerIcon extends AbstractMarkerIcon {
  /**
   * A Font Awesome icon name to use.
   */
  icon?: IconName;
}

interface AssetMarkerIcon extends AbstractMarkerIcon {
  /**
   * The id of an asset to use.
   */
  asset: number;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    latitude: string;
    longitude: string;
    disableClustering?: boolean;

    /**
     * Custom icon configuration.
     */
    icons?: FontAwesomeMarkerIcon | AssetMarkerIcon;

    /**
     * The maximum radius that a cluster will cover from the central marker (in pixels). Default 80.
     * Decreasing will make more, smaller clusters.
     * You can also use a function that accepts the current map zoom
     * and returns the maximum cluster radius in pixels.
     *
     * @minimum 1
     * @TJS-type integer
     */
    maxClusterRadius?: number;
  }

  interface Actions {
    onMarkerClick: {};
  }

  interface EventListeners {
    data: {};
  }

  interface EventEmitters {
    move: {};
  }
}
