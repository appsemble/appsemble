import type { BlockProps } from '@appsemble/preact';
import type { BulmaColor, Remapper } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';

interface AbstractField {
  /**
   * The label that is presented to the user. No label will be displayed if this is not defined.
   */
  label?: Remapper;
}

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

export interface FileField extends AbstractField {
  /**
   * The Remapper used to retrieve the data.
   */
  name: Remapper;

  /**
   * Displays files as images.
   */
  type: 'file';

  /**
   * Display one or multiple files.
   */
  repeated?: boolean;

  /**
   * The name of the property of the data to fetch from within each item.
   *
   * If not set, the item itself is used as the url.
   */
  repeatedName?: Remapper;
}

export interface GeoCoordinatesField extends AbstractField {
  /**
   * The path to base the longitude and latitude fields from.
   *
   * If `fields[].latitude` and `fields[].longitude` are not set it defaults to `fields[].name.lat`
   * and `fields[].name.lng`.
   */
  name?: Remapper;

  /**
   * The name of the field used to access the longitude value.
   *
   * If `fields[].name` is set it is retrieved relatively, otherwise it is fetched from the root of
   * the data.
   */
  latitude?: Remapper;

  /**
   * The name of the field used to access the latitude value.
   *
   * If `fields[].name` is set it is retrieved relatively, otherwise it is fetched from the root of
   * the data.
   */
  longitude?: Remapper;

  /**
   * Displays a map with a marker.
   */
  type: 'geocoordinates';
}

export interface StringField extends AbstractField {
  /**
   * The Remapper used to retrieve the data.
   */
  name: Remapper;

  /**
   * Displays the content as regular text.
   *
   * If the content is an object it will be converted using `JSON.stringify()`.
   */
  type?: 'string';
}

export type Field = FileField | GeoCoordinatesField | StringField;

export interface RendererProps<F extends Field> extends Partial<BlockProps> {
  /**
   * Structure used to define the field.
   */
  field: F;

  /**
   * The data that is passed through.
   */
  data: any;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The base URL of the associated files.
     *
     * If not defined, Appsemble’s Asset API will be used instead.
     */
    fileBase?: string;

    /**
     * A list of fields to display based on the name from the schema.
     */
    fields: Field[];

    /**
     * Custom icon configuration for geocoordinate fields.
     */
    icons?: FontAwesomeMarkerIcon | AssetMarkerIcon;
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
