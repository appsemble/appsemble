import type { Remapper } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';

/**
 * Properties that are shared between all requirements.
 */
export interface BaseRequirement {
  /**
   * The error message that is displayed when the requirement is not met.
   */
  errorMessage?: Remapper;
}

/**
 * Minimum and maximum form requirements for number fields.
 */
interface MinMaxRequirement extends BaseRequirement {
  /**
   * The minimum value of the field.
   */
  min?: number;

  /**
   * The maximum value of the field.
   */
  max?: number;
}

/**
 * Requirement used to indicate how big a step should be for the field.
 *
 * Note that for `integer` type fields are rounded _down_.
 */
interface StepRequirement extends BaseRequirement {
  /**
   * The amount to increment or decrement when using the stepper buttons of the field.
   */
  step: number;
}

/**
 * Requirement used to mark the field as required.
 */
export interface RequiredRequirement extends BaseRequirement {
  /**
   * Whether the field is required.
   */
  required: boolean;
}

interface FormRequirement extends BaseRequirement {
  /**
   * The list of fields that must be valid before running the requirement action.
   */
  isValid: string[];

  /**
   * The name of the action to trigger when the requirement is checked.
   *
   * @format action
   */
  action: string;
}

/**
 * Requirement that matches using a given regex.
 */
interface RegexRequirement extends BaseRequirement {
  /**
   * The regex to match with. Must be a valid JavaScript regex.
   */
  regex: string;

  /**
   * The flags to use for the regex.
   *
   * Supported values: `g`, `m`, `i`, `y`, `u`, `s`
   * @TJS-pattern ^[gimsuy]+$
   * @default 'g'
   */
  flags?: string;
}

/**
 * A requirement used to enforce the length of the input.
 */
interface LengthRequirement extends BaseRequirement {
  /**
   * The minimum length.
   *
   * @minimum 0
   */
  minLength?: number;

  /**
   * The maximum length.
   *
   * @minimum 0
   */
  maxLength?: number;
}

/**
 * All requirements applicable to string fields.
 */
export type StringRequirement = RegexRequirement | LengthRequirement | RequiredRequirement;

/**
 * All requirements applicable to number fields.
 */
export type NumberRequirement = StepRequirement | MinMaxRequirement | RequiredRequirement;

/**
 * An option that is displayed in a dropdown menu or radio button field.
 */
interface Choice {
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

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   *
   * This typically means that the checkbox *must* be checked.
   */
  requirements?: RequiredRequirement[];
}

/**
 * A radio button that returns the associated value when selected.
 */
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

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  // XXX: Implement field requirements
  requirements?: RequiredRequirement[];
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

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   *
   */
  // XXX: Implement field requirements
  requirements?: RequiredRequirement[];
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
   *
   * @default false
   */
  repeated?: boolean;

  /**
   * The quality modifier to use when uploading images, in percentages.
   */
  quality?: number;

  /**
   * The type of the field.
   */
  type: 'file';

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  // XXX: Implement field requirements
  requirements?: RequiredRequirement[];
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
   * The type of the field.
   */
  type: 'integer' | 'number';

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: NumberRequirement[];
}

/**
 * Fields with the type of [`string`](#StringField) support requirements. This is an array of
 * requirements that are used to validate the value the user inputs. Each requirement can be
 * provided with its own custom error message, allowing for better feedback towards users.
 *
 * For example, the [`regex`](#RegexRequirement) requirement type allows you to validate a field
 * using [Regular Expressions](https://learnxinyminutes.com/docs/pcre/). So for example if you want
 * a string field that requires a field to be an email address that ends with “@appsemble.com”,
 * you could enforce this like so:
 *
 * ```yaml
 * type: string
 * requirements:
 *   - regex: \w+@appsemble\.com
 *     errorMessage: Value does not end with “@appsemble.com”
 * ```
 */
export interface StringField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: string;

  /**
   * The format to use for validation.
   */
  format?: 'email' | 'url';

  /**
   * Whether the string field should be multiline or not.
   *
   * @default false
   */
  multiline?: boolean;
  /**
   * The type of the field.
   */
  type: 'string';

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: StringRequirement[];
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
     * Action that gets dispatched when the form is submitted.
     */
    onSubmit: {};

    /**
     * A custom action that gets dispatched when checking form requirements.
     */
    [key: string]: {};
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

    /**
     * A list of requirements that are checked across all of the form data.
     */
    requirements?: FormRequirement[];
  }
}
