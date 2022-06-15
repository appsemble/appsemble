import { BulmaColor, BulmaSize, IconName, Remapper } from '@appsemble/sdk';
import { JsonValue } from 'type-fest';

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
   * @default 'g'
   * @pattern ^[gimsuy]+$
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
 * A requirement used to enforce the range of available times.
 */
interface TimeRangeRequirement extends BaseRequirement {
  /**
   * The minimum time that can be selected.
   *
   * @default '00:00'
   * @pattern ^([01]\d|2[0-3]):([0-5]\d)$
   * @example '15:20'
   */
  minTime: string;

  /**
   * The maximum time that can be selected.
   *
   * @default '23:59'
   * @pattern ^([01]\d|2[0-3]):([0-5]\d)$
   * @example '15:20'
   */
  maxTime: string;
}

/**
 * A requirement that can be used to disable specific days.
 */
interface EnabledDayRequirement extends BaseRequirement {
  /**
   * Whether Mondays should be selectable.
   *
   * @default true
   */
  monday?: boolean;

  /**
   * Whether Tuesdays should be selectable.
   *
   * @default true
   */
  tuesday?: boolean;

  /**
   * Whether Wednesdays should be selectable.
   *
   * @default true
   */
  wednesday?: boolean;

  /**
   * Whether Thursdays should be selectable.
   *
   * @default true
   */
  thursday?: boolean;

  /**
   * Whether Fridays should be selectable.
   *
   * @default true
   */
  friday?: boolean;

  /**
   * Whether Saturdays should be selectable.
   *
   * @default true
   */
  saturday?: boolean;

  /**
   * Whether Sundays should be selectable.
   *
   * @default true
   */
  sunday?: boolean;
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
export type DateTimeRequirement =
  | EnabledDayRequirement
  | RangeRequirement
  | RequiredRequirement
  | TimeRangeRequirement;
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
  value: JsonValue;
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

  /**
   * The minute increment when pressing the up or down arrows on the time picker.
   *
   * @default 5
   * @minimum 1
   */
  minuteIncrement?: number;

  /**
   * The remapper used for formatting the date value’s label.
   *
   * The date value can be accessed using the `root` remapper.
   */
  dateFormat?: Remapper;

  /**
   * All requirements that are applicable to this type of field.
   */
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
   * 0 means Sunday, 1 means Monday, etc.
   *
   * @default 1
   */
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * The remapper used for formatting the date value’s label.
   *
   * The date value can be accessed using the `root` remapper.
   */
  dateFormat?: Remapper;

  /**
   * All requirements that are applicable to this type of field.
   */
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
   * The color of the checkbox.
   */
  color?: BulmaColor;

  /**
   * The size of the checkbox.
   *
   * @default 'normal'
   */
  size?: BulmaSize;

  /**
   * Whether the checkbox should display as a switch instead.
   *
   * @see https://wikiki.github.io/form/switch/
   */
  switch?: {
    /**
     * Whether the rounded style should be used.
     */
    rounded?: boolean;

    /**
     * Whether the thin style should be used.
     */
    thin?: boolean;

    /**
     * Whether the outlined style should be used.
     */
    outlined?: boolean;
  };

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
  defaultValue?: JsonValue;

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
  defaultValue?: JsonValue;

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
   * @default "Error loading options"
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
   * @default "Error loading options"
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
  defaultValue?: string;

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
  defaultValue?: Record<string, number>;

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
   * The type of the field.
   */
  type: 'hidden';

  /**
   * The default value of the field.
   */
  defaultValue?: JsonValue;
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

  /**
   * How to display the numeric field.
   *
   * By default a `number` input field is displayed.
   */
  display?: 'slider';

  /**
   * If `display` is set to `slider`, these labels are displayed evenly spaced below the slider.
   *
   * @minItems 2
   */
  bottomLabels?: Remapper[];

  /**
   * If `display` is set to `slider`, these labels are displayed evenly spaced on top of the slider.
   *
   * @minItems 2
   */
  topLabels?: Remapper[];
}

/**
 * A field that displays static content.
 *
 * This field does not contain a name or a value.
 */
export interface StaticField extends AbstractField {
  /**
   * The type of the field.
   */
  type: 'static';

  /**
   * The content to display.
   */
  content: Remapper;
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
  format?: 'email' | 'password' | 'url';

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
   *
   * @minItems 1
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
  | StaticField
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

/**
 * The expected data for the `fields` listener event.
 */
export interface FieldEventParameters {
  /**
   * The new fields to apply.
   */
  fields: Field[];

  /**
   * The values after applying the new set of fields.
   *
   * This is merged with the previous values if `keepValues` is set to `true`.
   */
  initialValues?: Values;

  /**
   * Whether or not the existing values should be kept or not.
   *
   * @default false
   */
  keepValues?: boolean;
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
     * An event that can be used to receive data.
     *
     * Compatible data that is received will be displayed and mapped to the fields as defined in the
     * `fields` parameter.
     *
     * `keepData` will retain the previous set of values if set to `true`
     *
     * `initialValues` as a mapping of key-value pairs
     * will be merged with the new fields’ default values.
     */
    data: never;

    /**
     * An event that can be used to dynamically replace the form’s fields.
     *
     * Include an array of fields in `fields` to replace the current list of fields in the block.
     */
    fields: never;

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
     *
     * @minItems 1
     */
    fields?: Field[];

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
