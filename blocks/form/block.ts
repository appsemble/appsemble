import { Remapper } from '@appsemble/sdk';
import { IconName } from '@fortawesome/fontawesome-common-types';

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
   *
   * @TJS-pattern ^[gimsuy]+$
   * @default 'g'
   */
  flags?: string;
}

/**
 * A requirement used to enforce the length or amount of items in the input.
 */
interface LengthRequirement extends BaseRequirement {
  /**
   * The minimum length.
   *
   * @minimum 1
   */
  minLength?: number;

  /**
   * The maximum length.
   *
   * @minimum 1
   */
  maxLength?: number;
}

interface AcceptRequirement extends BaseRequirement {
  /**
   * The list of accepted [MIME-types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types).
   */
  accept: string[];
}

/**
 * A requirement used to enforce the range of available dates.
 */
interface RangeRequirement extends BaseRequirement {
  /**
   * The minimum date that can be picked.
   */
  from?: Remapper;

  /**
   * The maximum date that can be picked.
   */
  to?: Remapper;
}

/**
 * All requirements applicable to string fields.
 */
export type StringRequirement = LengthRequirement | RegexRequirement | RequiredRequirement;

/**
 * All requirements applicable to number fields.
 */
export type NumberRequirement = MinMaxRequirement | RequiredRequirement | StepRequirement;

/**
 * All requirements applicable to file fields.
 */
export type FileRequirement = AcceptRequirement | LengthRequirement | RequiredRequirement;

/**
 * All requirements applicable to date-time fields.
 */
export type DateTimeRequirement = RangeRequirement | RequiredRequirement;

/**
 * All requirements applicable to object fields.
 */
export type ObjectRequirement = LengthRequirement;

/**
 * An option that is displayed in a dropdown menu or radio button field.
 */
export interface Choice {
  /**
   * The label used to display the option.
   */
  label?: Remapper;

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
  label?: Remapper;

  /**
   * The name used when storing this field.
   */
  name: string;

  /**
   * The placeholder to display when the field is empty.
   */
  placeholder?: Remapper;

  /**
   * Whether the field should be read-only.
   */
  readOnly?: boolean;

  /**
   * The label that is shown to the right of the label.
   *
   * Replaces the optional label if the field is optional.
   * Won’t display if the field has no label of its own.
   */
  tag?: Remapper;
}

/**
 * A date/time picker that results in an exact date and time.
 */
export interface DateTimeField extends AbstractField {
  /**
   * The type of the field.
   */
  type: 'date-time';

  /**
   * The day to display as the first day of the week.
   *
   * 0 means sunday, 1 means monday, etc.
   *
   * @default 1
   */
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  requirements?: DateTimeRequirement[];
}

/**
 * A date/time picker that results in an exact date and time.
 */
export interface DateField extends AbstractField {
  /**
   * The type of the field.
   */
  type: 'date';

  /**
   * The day to display as the first day of the week.
   *
   * 0 means sunday, 1 means monday, etc.
   *
   * @default 1
   */
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  requirements?: DateTimeRequirement[];
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
  labelText?: Remapper;

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
  requirements?: RequiredRequirement[];
}

interface AbstractEnumField extends AbstractField {
  /**
   * The type of the field.
   */
  type: 'enum';

  /**
   * The default value of the field.
   */
  defaultValue?: any;

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: RequiredRequirement[];
}

/**
 * A dropdown list containing a list of predetermined values.
 */
interface SyncEnumField extends AbstractEnumField {
  /**
   * The list of available choices.
   */
  enum: Choice[];
}

/**
 * A dropdown list containing a list of values based on the output of an action.
 */
interface ActionEnumField extends AbstractEnumField {
  /**
   * This action will be fired to fetch dynamic enum options.
   *
   * The action should return an array of objects that contain the `label` and `value` property.
   *
   * @format action
   */
  action: string;

  /**
   * This message is displayed if the options failed to load.
   *
   * @default 'Error loading options'
   */
  loadError?: Remapper;
}

/**
 * A dropdown list containing a list of values based on the output of an event.
 */
interface EventEnumField extends AbstractEnumField {
  /**
   * Wait until an event has been fired containing the list of options.
   *
   * The event should return an array of objects that contain the `label` and `value` property.
   *
   * @format event-listener
   */
  event: string;

  /**
   * This message is displayed if the options failed to load.
   *
   * @default 'Error loading options'
   */
  loadError?: Remapper;
}

export type EnumField = ActionEnumField | EventEnumField | SyncEnumField;

/**
 * An input field used to upload files.
 */
export interface FileField extends AbstractField {
  /**
   * The default value for the field.
   */
  defaultValue?: any;

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
  requirements?: FileRequirement[];

  /**
   * The label that is shown for empty files.
   *
   * @default ' '
   */
  emptyFileLabel?: Remapper;
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
   * The location (latitude, longitude) to default to when the user’s location cannot be found.
   *
   * This can be used to set the location to something that is more relevant to the user.
   *
   * @default [51.476852, 0]
   */
  defaultLocation?: [number, number];

  /**
   * The error message to display when the location couldn’t be determined.
   *
   * @default 'Couldn’t find your location. Are location services enabled?'
   */
  locationError?: Remapper;

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

export interface ObjectField extends AbstractField {
  /**
   * The type of the field.
   */
  type: 'object';

  /**
   * If true, this field represents an array of objects.
   */
  repeated?: boolean;

  /**
   * The label to show on the button for adding a new entry for repeated fields.
   *
   * @default 'Remove'
   */
  addLabel?: Remapper;

  /**
   * The label to show on the button for removing an entry for repeated fields.
   *
   * @default 'Add'
   */
  removeLabel?: Remapper;

  /**
   * The fields contained by this object.
   */
  fields: Field[];

  /**
   * Requirements that are applicable to an object field.
   */
  requirements?: ObjectRequirement[];
}

export type Field =
  | BooleanField
  | DateField
  | DateTimeField
  | EnumField
  | FileField
  | GeoCoordinatesField
  | HiddenField
  | NumberField
  | ObjectField
  | RadioField
  | StringField;

export type Values = Record<string, unknown>;

export type FieldError = FieldError[] | FieldErrorMap | boolean | string;

// Not using an interface causes an invalid circular reference.
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface FieldErrorMap {
  [key: string]: FieldError;
}

export interface InputProps<T, F extends Field> {
  /**
   * Whether or not the field should be disabled.
   */
  disabled?: boolean;

  /**
   * A field error object.
   */
  error: FieldError;

  /**
   * The field to render.
   */
  field: F;

  /**
   * The fully resolved field name.
   */
  name: string;

  /**
   * A callback for when the value changes.
   */
  onChange: (name: Event | string, value?: T) => void;

  /**
   * Whether ot not the input has been modified by the user.
   */
  dirty?: boolean;

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
    onSubmit: never;

    /**
     * Action that gets dispatched when the previous button is clicked.
     */
    onPrevious?: never;

    /**
     * A custom action that gets dispatched when checking form requirements.
     */
    [key: string]: never;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed and mapped to the fields as defined in the
     * `fields` parameter.
     */
    data: never;

    /**
     * Custom event listeners that can be used to receive data for specific types of form fields.
     */
    [key: string]: never;
  }

  interface EventEmitters {
    /**
     * This event is emitted every time a change is made to the form.
     *
     * The data received in the entire form data.
     */
    change: never;
  }

  interface Messages {
    submitLabel: never;
    submitError: never;
    optionalLabel: never;
    fieldErrorLabel: never;
    formRequirementError: never;
    invalidLabel: never;
    previousLabel: never;
  }

  interface Parameters {
    /**
     * A list of objects describing each field that can be entered in the form.
     */
    fields: Field[];

    /**
     * Whether the previous button should be shown.
     */
    previous?: boolean;

    /**
     * A list of requirements that are checked across all of the form data.
     */
    requirements?: FormRequirement[];
  }
}
