import type { BlockProps } from '@appsemble/preact';
import type { Remapper } from '@appsemble/sdk';

interface AbstractField {
  label?: Remapper;
}

export interface FileField extends AbstractField {
  name: Remapper;
  type: 'file';
  repeated?: boolean;
  repeatedName?: Remapper;
}

export interface GeoCoordinatesField extends AbstractField {
  name?: Remapper;
  latitude?: Remapper;
  longitude?: Remapper;
  type: 'geocoordinates';
}

export interface StringField extends AbstractField {
  name: Remapper;
  type?: 'string';
}

export type Field = FileField | GeoCoordinatesField | StringField;

export interface RendererProps<F extends Field> extends Partial<BlockProps> {
  /**
   * Structure used to define the field.
   */
  field: F;

  /**
   * The current value.
   */
  value: any;

  data: any;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    fileBase?: string;
    fields: Field[];
  }

  interface EventListeners {
    data: {};
  }
}
