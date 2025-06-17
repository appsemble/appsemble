import { type BulmaColor, type BulmaSize, type IconName, type Remapper } from '@appsemble/sdk';
import { type MutableRef } from 'preact/hooks';

export enum Requirement {
  Required = 'required',
  Prohibited = 'prohibited',
  From = 'from',
  To = 'to',
  Min = 'min',
  Max = 'max',
  MinLength = 'minLength',
  MaxLength = 'maxLength',
  MinItems = 'minItems',
  MaxItems = 'maxItems',
  MinSize = 'minSize',
  MaxSize = 'maxSize',
  Accept = 'accept',
  Step = 'step',
  Regex = 'regex',
}

type JsonValue = JsonValue[] | boolean | number | string | { [key: string]: JsonValue } | null;

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
   *
   * We recommend passing a boolean value e.g. `true`.
   *
   * Another option is to pass a remapper returning a boolean value.
   * This way you can conditionally control if the field is required.
   */
  required: Remapper;
}

/**
 * Requirement used to mark the field as prohibited.
 */
export interface ProhibitedRequirement extends BaseRequirement {
  /**
   * Whether the field is prohibited, e.g. must not have a value.
   *
   * We recommend passing a boolean value e.g. `true`.
   *
   * Another option is to pass a remapper returning a boolean value.
   * This way you can conditionally control if the field is prohibited.
   */
  prohibited: Remapper;
}

interface FormRequirement extends BaseRequirement {
  /**
   * The list of fields that must be valid before running the requirement action.
   */
  isValid: string[];

  /**
   * Whether the field should always be validated
   * even if the previous value was valid and hasn’t changed.
   */
  alwaysValidate?: boolean;

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
export interface RegexRequirement extends BaseRequirement {
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
   */
  minLength?: Remapper;

  /**
   * The maximum length.
   */
  maxLength?: Remapper;
}

/**
 * A requirement used to enforce the size of the input.
 */
interface SizeRequirement extends BaseRequirement {
  /**
   * The minimum size in bytes.
   *
   * @minimum 1
   */
  minSize?: number;

  /**
   * The maximum size in bytes.
   *
   * @minimum 1
   */
  maxSize?: number;
}

/**
 * A requirement used to enforce the length or amount of items in the input.
 */
interface CountRequirement extends BaseRequirement {
  /**
   * The minimum number of items.
   *
   * @minimum 1
   */
  minItems?: number;

  /**
   * The maximum number of items.
   *
   * @minimum 1
   */
  maxItems?: number;
}

export interface AcceptRequirement extends BaseRequirement {
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
export type TagsRequirement = CountRequirement | MinMaxRequirement | RegexRequirement;

/**
 * All requirements applicable to string fields.
 */
export type SelectionRequirement = CountRequirement;

/**
 * All requirements applicable to string fields.
 */
export type StringRequirement =
  | LengthRequirement
  | ProhibitedRequirement
  | RegexRequirement
  | RequiredRequirement;

/**
 * All requirements applicable to number fields.
 */
export type NumberRequirement =
  | MinMaxRequirement
  | ProhibitedRequirement
  | RequiredRequirement
  | StepRequirement;

/**
 * All requirements applicable to boolean fields.
 */
export type BooleanRequirement = ProhibitedRequirement | RequiredRequirement;

/**
 * All requirements applicable to radio fields.
 */
export type RadioRequirement = ProhibitedRequirement | RequiredRequirement;

/**
 * All requirements applicable to enum fields.
 */
export type EnumRequirement = ProhibitedRequirement | RequiredRequirement;

/**
 * All requirements applicable to list fields.
 */
export type ListRequirement = ProhibitedRequirement | RequiredRequirement;

/**
 * All requirements applicable to file fields.
 */
export type FileRequirement =
  | AcceptRequirement
  | LengthRequirement
  | ProhibitedRequirement
  | RequiredRequirement
  | SizeRequirement;

/**
 * All requirements applicable to date-time fields.
 */
export type DateTimeRequirement =
  | EnabledDayRequirement
  | ProhibitedRequirement
  | RangeRequirement
  | RequiredRequirement
  | TimeRangeRequirement;

/**
 * All requirements applicable to fieldsets.
 */
export type FieldsetRequirement = LengthRequirement;

export type GeocoordinateRequirement = ProhibitedRequirement | RequiredRequirement;

export type MarkdownRequirement = RequiredRequirement;

/**
 * An option that is displayed in a dropdown menu or radio button field.
 */
export interface Choice {
  /**
   * If true, the choice will be disabled.
   *
   * @default false
   */
  disabled?: boolean;

  /**
   * The label used to display the option.
   */
  label?: Remapper;

  /**
   * Name of the [Font Awesome icon](https://fontawesome.com/icons?m=free) to be displayed in the option.
   */
  icon?: IconName;

  /**
   * The value to use when selecting the option.
   */
  value: JsonValue;
}

export interface Image {
  /**
   * The image to show in the cell.
   *
   * image can either be url or uploaded image
   */
  file: Remapper;

  /**
   * The alt text of the image.
   *
   */
  alt?: Remapper;

  /**
   * Is image rounded.
   *
   */
  rounded?: boolean;

  /**
   * The alignment of the text content.
   *
   * @default 'default'
   */
  alignment?: 'default' | 'header';

  /**
   * The image is scaled with bulma sizes.
   *
   * @default 48
   */
  size?: 16 | 24 | 32 | 48 | 64 | 96 | 128;
}

/**
 * An object representing how a data field should be displayed.
 */
export interface SelectionChoiceField {
  /**
   * The name of the field to read from to determine the value to show.
   *
   * No value will be rendered if undefined.
   */
  value?: Remapper;

  /**
   * The label to display.
   *
   * Will not render if undefined.
   */
  label?: Remapper;

  /**
   * The [Font Awesome icon](https://fontawesome.com/icons?m=free) to display in front of the label.
   *
   * Will not render if undefined.
   */
  icon?: IconName;
}

/**
 * An option that is displayed in the dialog of a selection field.
 */
export interface SelectionChoice {
  /**
   * The unique identifier for the choice.
   */
  id: number | string;

  /**
   * The header text to display above the list of fields.
   *
   * Will not render if undefined.
   */
  header?: Remapper;

  /**
   * The icon that displays in front of the header.
   *
   * Will not render if undefined.
   */
  icon?: IconName;

  /**
   * A list of fields to display.
   */
  fields?: SelectionChoiceField[];

  /**
   * The image that is shown to the left of the list item.
   *
   * This can be either a full image path or an asset id.
   */
  image?: Image;

  /**
   * Nests image on the left inside the inline block.
   */
  imageInline?: boolean;
}

interface AbstractField {
  /**
   * Displays field only if condition is true.
   *
   * If not specified, the field will display.
   */
  show?: Remapper;

  /**
   * Whether the field should always be be disabled.
   *
   * @default false
   */
  disabled?: Remapper;

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
   *
   * @default false
   */
  readOnly?: Remapper;

  /**
   * The label that is shown to the right of the label.
   *
   * Replaces the optional label if the field is optional.
   * Won’t display if the field has no label of its own.
   */
  tag?: Remapper;

  /**
   * A description for the text field.
   * For adding more information about the field.
   */
  help?: Remapper;
}

interface InlineField {
  /**
   * Combines fields on the same row.
   *
   * Fields are combined in order if set to true.
   */
  inline?: true;
}

/**
 * A date/time picker that results in an exact date and time.
 */
export interface DateTimeField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: string;

  /**
   * Whether the confirm button should be shown
   *
   * @default false
   */
  confirm?: boolean;

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

  /**
   * Whether typing input in date field is allowed
   *
   * @default false
   */
  allowInput?: boolean;

  /**
   * The accepted alternative format of the date field when typing in the input.
   *
   * @default Y-m-d
   */
  altFormat?: string;

  /**
   * Whether to use the alternative format as the allowed format that the user
   * has to follow when typing in a date.
   *
   * @default false
   */
  altInput?: boolean;
}

/**
 * A date/time picker that results in an exact date and time.
 */
export interface DateField extends AbstractField, InlineField {
  /**
   * The default value of the field.
   */
  defaultValue?: string;

  /**
   * Whether the confirm button should be shown
   *
   * @default false
   */
  confirm?: boolean;

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

  /**
   * Whether typing input in date field is allowed
   *
   * @default false
   */
  allowInput?: boolean;

  /**
   * The accepted alternative format of the date field when typing in the input.
   *
   * @default Y-m-d
   */
  altFormat?: string;

  /**
   * Whether to use the alternative format as the allowed format that the user
   * has to follow when typing in a date.
   *
   * @default false
   */
  altInput?: boolean;
}

/**
 * A checkbox that returns `true` when checked and `false` when not.
 */
export interface BooleanField extends AbstractField, InlineField {
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
  requirements?: BooleanRequirement[];
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
  requirements?: RadioRequirement[];
}

interface AbstractEnumField extends AbstractField, InlineField {
  /**
   * The type of the field.
   */
  type: 'enum';

  /**
   * The default value of the field.
   */
  defaultValue?: JsonValue;

  /**
   * The filter applied to the options
   */
  filter?: boolean;

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: EnumRequirement[];

  /**
   * This action will be fired when an option is selected.
   *
   * Must be present in the actions of the form
   *
   * @format action
   */
  onSelect?: string;
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
 * A dropdown list containing a list of remapped values.
 */
interface RemapperEnumField extends AbstractEnumField {
  /**
   * The inline remapper to get the enum options.
   */
  remapper: Remapper;
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

export type EnumField = ActionEnumField | EventEnumField | RemapperEnumField | SyncEnumField;

export interface AbstractListField extends AbstractField, InlineField {
  /**
   * The type of the field.
   */
  type: 'list';

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: ListRequirement[];
}

export interface EventListField extends AbstractListField {
  /**
   * Wait until an event has been fired containing the list of options.
   * The event should return an array of objects that contain the `label` and `value` property.
   *
   * @format event-listener
   */
  event: string;
}

export interface SyncListField extends AbstractListField {
  /**
   * A list of enum options.
   */
  list: Choice[];
}

export type ListField = EventListField | SyncListField;

export interface AbstractSelectionField extends AbstractField, InlineField {
  /**
   * The type of the field.
   */
  type: 'selection';

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: SelectionRequirement[];

  /**
   * The label to show on the button for adding a new entry.
   *
   * @default 'Add'
   */
  addLabel?: Remapper;

  /**
   * Whether to disable the search field for the selection choices.
   *
   * @default false
   */
  disableSearch?: boolean;

  /**
   * Whether to show already selected choices in the selection modal.
   *
   * @default false
   */
  showSelectedInModal?: boolean;

  /**
   * Whether to allow removing selected choices from within the selection modal.
   *
   * @default false
   */
  allowRemovalFromModal?: boolean;

  /**
   * An action that is fired when a choice is removed.
   *
   * @format action
   */
  onRemoveChoice?: string;
}

export interface EventSelectionField extends AbstractSelectionField {
  /**
   * Wait until an event has been fired containing the list of options.
   * The event should return an array of objects.
   *
   * @format event-listener
   */
  event: string;
}

export interface SyncSelectionField extends AbstractSelectionField {
  /**
   * A list of selection options.
   */
  selection: SelectionChoice[];
}

export type SelectionField = EventSelectionField | SyncSelectionField;

/**
 * An input field used to upload files.
 */
export interface FileField extends AbstractField, InlineField {
  /**
   * The default value for the field.
   */
  defaultValue?: string;

  /**
   * The maximum height of uploaded files.
   */
  maxHeight?: number;

  /**
   * The maximum width of uploaded files.
   */
  maxWidth?: number;

  /**
   * The maximum size of uploaded files.
   */
  maxSize?: number;

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

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: GeocoordinateRequirement[];
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
export interface NumberField extends AbstractField, InlineField {
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

export interface RangeField extends Omit<NumberField, 'display' | 'type'> {
  type: 'range';
  from?: Remapper;
  to?: Remapper;
}

/**
 * A field that displays static content.
 *
 * This field does not contain a name or a value.
 */
export interface StaticField extends AbstractField, InlineField {
  /**
   * The type of the field.
   */
  type: 'static';

  /**
   * The content to display.
   */
  content: Remapper;
}

export interface TagsField extends AbstractField, InlineField {
  /**
   * The type of the field.
   */
  type: 'tags';

  /**
   * The requirements that are used to validate the field with.
   *
   * These are evaluated in the order they are defined in.
   */
  requirements?: TagsRequirement[];
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
export interface StringField extends AbstractField, InlineField {
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
   * Whether the field expects a datalist
   *
   * If a static array is passed to `datalist`, it will be used
   *
   * Otherwise, the field will attempt to get the datalist from the object passed to it
   *
   * If `multiline` is set to true, this is ignored
   *
   * @default false
   */
  datalistEnabled?: boolean;

  /**
   * Used to display a static html datalist for the field
   *
   * @default []
   */
  datalist?: { value: string }[];

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

export interface Fieldset extends AbstractField {
  /**
   * The type of the field.
   */
  type: 'fieldset';

  /**
   * If true, this fieldset represents an array of objects.
   */
  repeated?: boolean;

  /**
   * The label to show on the button for adding a new entry for repeated fields.
   *
   * @default 'Add'
   */
  addLabel?: Remapper;

  /**
   * The label to show on the button for removing an entry for repeated fields.
   *
   * @default 'Remove'
   */
  removeLabel?: Remapper;

  /**
   * The fields contained by this fieldset.
   *
   * @minItems 1
   */
  fields: Field[];

  /**
   * Requirements that are applicable to a fieldset.
   */
  requirements?: FieldsetRequirement[];
}

export interface MarkdownField extends AbstractField {
  /**
   * The default value of the field.
   */
  defaultValue?: string;

  /**
   * The type of the field.
   */
  type: 'markdown';

  /**
   * Requirements that are applicable to a markdown field.
   */
  requirements?: MarkdownRequirement[];
}

export type Field =
  | BooleanField
  | DateField
  | DateTimeField
  | EnumField
  | Fieldset
  | FileField
  | GeoCoordinatesField
  | HiddenField
  | ListField
  | MarkdownField
  | NumberField
  | RadioField
  | RangeField
  | SelectionField
  | StaticField
  | StringField
  | TagsField;

export type Values = Record<string, unknown>;

export type FieldError = FieldError[] | FieldErrorMap | boolean | string;

// Not using an interface causes an invalid circular reference.
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface FieldErrorMap {
  [key: string]: FieldError;
}

export interface InputProps<T, F extends Field> {
  /**
   * Any additional classnames that should be applied.
   */
  className?: string;

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
   * Whether or not the input has been modified by the user.
   */
  dirty?: boolean;

  /**
   * Whether or not the field is read-only.
   */
  readOnly?: boolean;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;

  /**
   * The current form values.
   */
  formValues: Values;

  /**
   * The current fieldset entry values.
   */
  fieldsetEntryValues?: Values;

  /**
   * The ref to the element used for scrolling to the field error
   */
  readonly errorLinkRef?: MutableRef<HTMLElement>;
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

export type FormDisplay = 'flex' | 'grid';

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

    /**
     * Action that can be used to load data to pre-fill the form.
     */
    onLoad?: never;
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
    confirmLabel: never;
    submitLabel: never;
    submitError: never;
    optionalLabel: never;
    fieldErrorLabel: never;
    formRequirementError: never;
    invalidLabel: never;
    previousLabel: never;
    search: never;
    selectionNoOptions: never;
    selectionOptionsError: never;
    fixErrors: never;
    longSubmissionWarning: never;
  }

  interface Parameters {
    /**
     * Specify a form title
     */
    title?: Remapper;

    /**
     * This allows you to update fields automatically with actions by typing in a selected field.
     *
     * To authenticate with an external API see [Services](../../../docs/guides/service)
     */
    autofill?: {
      /**
       * The name of the action to trigger when the selected field values are changed.
       *
       * The final output of the action(s) will get applied to the form fields.
       *
       * @format action
       */
      action: string;

      /**
       * The names of the fields for which to detect changes.
       */
      names: string[];

      /**
       * Set how many `milliseconds` it must take between input changes to call the action.
       *
       * @default 1000
       */
      delay?: number;
    };

    /**
     * If this remapper yields true, the submit button will be disabled.
     *
     * @default false
     */
    disabled?: Remapper;

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
     * Whether the submit button should not be visible, useful when the only field is an enum and
     * **onSelect** is defined
     *
     */
    hideSubmitButton?: Remapper;

    /**
     * Whether or not space should be reserved for the help text.
     *
     * If this is left as `true`, any help text appearing will cause the form input to jump around
     * due to layout changes.
     *
     * @default true
     */
    dense?: boolean;

    /**
     * Weather the form should take up all available width on the page.
     *
     * @default false
     */
    fullWidth?: boolean;

    /**
     * How the form fields should be displayed.
     *
     * @default 'flex'
     */
    display?: FormDisplay;

    /**
     * Whether or not to disable populating fields with default data values.
     *
     * If this is set to `true`, the default values for the fields won't contain
     * data from [page storage](../../../docs/guides/storage#app-storage).
     *
     * @default false
     */
    disableDefault?: boolean;

    /**
     * A list of requirements that are checked across all of the form data.
     */
    requirements?: FormRequirement[];

    /**
     * By default the form block will wait until event data is received.
     *
     * By setting this to `true`, this won’t happen.
     */
    skipInitialLoad?: boolean;

    /**
     * After this duration in milliseconds, a message will display urging the
     * user to wait because the form is taking long to submit.
     *
     * @default 5000
     */
    longSubmissionDuration?: number;
  }
}
