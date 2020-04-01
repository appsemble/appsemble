import type { BlockProps } from '@appsemble/preact';

interface AbstractField {
  label?: string;
}

export interface FileField extends AbstractField {
  name: string;
  type: 'file';
  repeated?: boolean;
  repeatedName?: string;
}

export interface GeoCoordinatesField extends AbstractField {
  name?: string;
  latitude?: string;
  longitude?: string;
  type: 'geocoordinates';
}

export interface StringField extends AbstractField {
  name: string;
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
