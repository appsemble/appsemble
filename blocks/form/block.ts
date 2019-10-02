import { IconName } from '@fortawesome/fontawesome-common-types';

interface Choice {
  label?: string;
  value: string;
}

interface AbstractField {
  icon?: IconName;
  label?: string;
  name: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
}

export interface BooleanField extends AbstractField {
  defaultValue?: boolean;
  labelText?: string;
  type: 'boolean';
}

export interface EnumField extends AbstractField {
  defaultValue?: any;
  enum: Choice[];
  type: 'enum';
}

export interface FileField extends AbstractField {
  defaultValue?: any;
  accept?: string[];
  maxHeight?: number;
  maxWidth?: number;
  repeated?: true;
  quality?: number;
  type: 'file';
}

export interface GeoCoordinatesField extends AbstractField {
  defaultValue?: object;
  type: 'geocoordinates';
}

export interface HiddenField extends AbstractField {
  defaultValue?: any;
  type: 'hidden';
}

export interface NumberField extends AbstractField {
  defaultValue?: number;
  max?: number;
  min?: number;
  step?: number;
  type: 'integer' | 'number';
}

export interface StringField extends AbstractField {
  defaultValue?: string;
  format?: 'email' | 'url';
  maxLength?: number;
  multiline?: boolean;
  type: 'string';
}

export type Field =
  | BooleanField
  | EnumField
  | FileField
  | GeoCoordinatesField
  | HiddenField
  | NumberField
  | StringField;

export interface InputProps<T, F extends Field> {
  /**
   * A field error object.
   */
  error: string;

  /**
   * The field to render.
   */
  field: F;

  /**
   * A callback for when the value changes.
   */
  onInput: (event: Event, value: T) => void;

  /**
   * The current value.
   */
  value: T;
}

export interface Actions {
  onSubmitSuccess: {};
  onSubmit: {};
}

export interface Parameters {
  fields: Field[];
}
