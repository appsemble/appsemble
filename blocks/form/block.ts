interface Choice {
  label?: string;
  value: string;
}

export interface Field {
  accept?: string[];
  enum: Choice[];
  defaultValue: any;
  label?: string;
  labelText?: string;
  max?: number;
  maxHeight?: number;
  maxLength?: number;
  maxWidth?: number;
  min?: number;
  multiline?: boolean;
  name: string;
  placeholder?: string;
  quality?: number;
  readOnly?: boolean;
  repeated?: true;
  required?: boolean;
  step?: number;
  type?: 'integer';
  format?: 'email' | 'url';
}

export interface InputProps<T> {
  /**
   * A field error object.
   */
  error: string;

  /**
   * The field to render.
   */
  field: Field;

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
