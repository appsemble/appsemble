import { BlockProps } from '@appsemble/react';

export interface Field {
  label?: string;
  latitude?: string;
  longitude?: string;
  name: string;
  repeated?: boolean;
  repeatedName: string;
  type: 'file' | 'geocoordinates' | 'string';
}

export interface Actions {
  onLoad: {};
}

export interface Parameters {
  fileBase: string;
  fields: Field[];
}

export interface RendererProps extends Partial<BlockProps<Parameters, Actions>> {
  /**
   * Structure used to define the field.
   */
  field: Field;

  /**
   * The current value.
   */
  value: any;

  data: any;
}
