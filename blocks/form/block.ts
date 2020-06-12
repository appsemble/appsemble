import type { IconName } from '@fortawesome/fontawesome-common-types';

/**
 * An option that is displayed in a dropdown menu or radio button field.
 */
interface Choice {
  labelText: any;
  /**
   * The label used to display the option.
   */
  label?: string;

  /**
   * The value to use when selecting the option.
   */
  value: any;
}

interface AbstractField {
  /**
   * Name of the [Font Awesome icon](https://fontawesome.com/icons?m=free) to be displayed next to
   * the label.
   */
  icon?: IconName;

  /**
   * The label displayed next to the field.
   */
  label?: string;

  /**
   * The name used when storing this field.
   */
  name: string;

  /**
   * The placeholder to display when the field is empty.
   */
  placeholder?: string;

  /**
   * Whether the field should be read-only.
   */
  readOnly?: boolean;

  /**
   * Whether the field is required or not. The form input will be validated based on its type.
   */
  required?: boolean;
}

/**
 * A checkbox that returns `true` when checked and `false` when not.
 */
export interface BooleanField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: boolean;

  /**
   * The text to display next to the checkbox.
   */
  labelText?: string;

  /**
   * The type of the field.
   */
  type: 'boolean';
}

export interface RadioField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: any;

  /**
   * The list of options the user can select from.
   */
  options?: Choice[];

  type: 'radio';
}

/**
 * A dropdown list containing a list of predetermined values.
 */
export interface EnumField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: any;

  /**
   * The list of available choices.
   */
  enum: Choice[];

  /**
   * The type of the field.
   */
  type: 'enum';
}

/**
 * An input field used to upload files.
 */
export interface FileField extends AbstractField {
  /**
   * 	The default value for the field.
   */
  defaultValue?: any;

  /**
   * A list of accepted [MIME-types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types).
   */
  accept?: string[];

  /**
   * The maximum height of uploaded images.
   */
  maxHeight?: number;

  /**
   * The maximum width of uploaded images.
   */
  maxWidth?: number;

  /**
   * Boolean value representing whether to accept one file or multiple files.
   */
  repeated?: true;

  /**
   * The quality modifier to use when uploading images, in percentages.
   */
  quality?: number;

  /**
   * The type of the field.
   */
  type: 'file';
}

/**
 * A location picker used to select a location.
 */
export interface GeoCoordinatesField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: object;

  /**
   * The type of the field.
   */
  type: 'geocoordinates';
}

/**
 * A hidden field. This is useful for submitting default values the user may not change.
 */
export interface HiddenField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: any;
  /**
   * The type of the field.
   */
  type: 'hidden';
}

/**
 * A number entry field.
 */
export interface NumberField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: number;

  /**
   * The maximum value of the field.
   */
  max?: number;

  /**
   * The minimum value of the field.
   */
  min?: number;

  /**
   * The amount to increment or decrement when using the stepper buttons of the field.
   */
  step?: number;

  /**
   * The type of the field.
   */
  type: 'integer' | 'number';
}

export interface StringField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: string;
  format?: 'email' | 'url';
  maxLength?: number;
  multiline?: boolean;
  /**
   * The type of the field.
   */
  type: 'string';
}

export type Field =
  | BooleanField
  | EnumField
  | FileField
  | GeoCoordinatesField
  | HiddenField
  | NumberField
  | StringField
  | RadioField;

export interface InputProps<T, F extends Field> {
  /**
   * Whether or not the field should be disabled.
   */
  disabled?: boolean;

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

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * Action that gets dispatched when the form has been submitted successfully.
     */
    onSubmitSuccess: {};

    /**
     * Action that gets dispatched when the form is submitted.
     */
    onSubmit: {};
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed and mapped to the fields as defined in the
     * `fields` parameter.
     */
    data: {};
  }

  interface Parameters {
    /**
     * A list of objects describing each field that can be entered in the form.
     */
    fields: Field[];

    /**
     * The text that is shown in the submit button.
     */
    submitLabel?: string;
  }
}
