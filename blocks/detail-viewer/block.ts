import { BlockProps } from '@appsemble/preact';

interface AbstractField {
  label?: string;
  name: string;
}

export interface FileField extends AbstractField {
  type: 'file';
  repeated?: boolean;
  repeatedName?: string;
}

export interface GeoCoordinatesField extends AbstractField {
  latitude?: string;
  longitude?: string;
  type: 'geocoordinates';
}

export interface StringField extends AbstractField {
  type?: 'string';
}

export type Field = FileField | GeoCoordinatesField | StringField;

export interface Actions {
  onLoad: {};
}

export interface Parameters {
  fileBase?: string;
  fields: Field[];
}

export interface RendererProps<F extends Field> extends Partial<BlockProps<Parameters, Actions>> {
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
