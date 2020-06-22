import type { BlockProps } from '@appsemble/preact';
import type { Remapper } from '@appsemble/sdk';

interface AbstractField {
  /**
   * The label that is presented to the user. No label will be displayed if this is not defined.
   */
  label?: Remapper;
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
   * The class names to apply to the component.
   */
  className?: string;

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
