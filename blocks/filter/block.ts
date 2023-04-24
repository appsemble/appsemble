import { type IconName, type Remapper } from '@appsemble/sdk';
import { type JSX } from 'preact/jsx-runtime';

export interface EnumOption {
  /**
   * The value that gets submitted when filtering.
   */
  value?: string;

  /**
   * User facing label describing the option.
   */
  label?: Remapper;
}

export interface ButtonOption {
  /**
   * The value that gets submitted when filtering.
   */
  value: string;

  /**
   * User-facing label describing the option.
   */
  label?: Remapper;

  /**
   * An icon to render on the button.
   */
  icon: IconName;
}

export interface AbstractField<T extends string, D> {
  /**
   * The name of the field to filter on.
   */
  name: string;

  /**
   * The type of the filter field.
   */
  type: T;

  /**
   * The label displayed next to the field.
   */
  label?: Remapper;

  /**
   * Name of the [Font Awesome icon](https://fontawesome.com/icons?m=free) to be displayed next to
   * the label.
   */
  icon?: IconName;

  /**
   * The filter to apply by default.
   */
  defaultValue?: D;
}

export interface ButtonsField extends AbstractField<'buttons', string[]> {
  /**
   * A list of button options.
   */
  options: ButtonOption[];
}

export type DateField = AbstractField<'date', string>;

export interface DateRangeField extends AbstractField<'date-range', [string, string]> {
  /**
   * The label to render on the `from` field.
   */
  fromLabel?: Remapper;

  /**
   * The label to render on the `to` field.
   */
  toLabel?: Remapper;
}

export interface EnumField extends AbstractField<'enum', string> {
  /**
   * A list of enum options.
   */
  enum: EnumOption[];
}

export interface StringField extends AbstractField<'string', string> {
  /**
   * By default string fields search for fields containing the user input.
   *
   * By setting this to true, an exact match is used.
   */
  exact?: boolean;
}

export type Field = ButtonsField | DateField | DateRangeField | EnumField | StringField;

export type FilterValue = Field['defaultValue'];

export type FilterValues = Record<string, FilterValue>;

export interface FieldComponentProps<F extends Field, T = F['defaultValue']> {
  className?: string;

  field: F;

  highlight?: boolean;

  loading: boolean;

  onChange: (event: JSX.TargetedEvent<HTMLElement & { name: string }>, value: T) => void;

  value: T;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * A list of fields the user is allowed to search on.
     */
    fields: Field[];

    /**
     * The name of a field to highlight.
     *
     * This means this field will be displayed directly on the screen instead of in the modal.
     */
    highlight?: string;
  }

  interface Messages {
    /**
     * The title of the modal.
     */
    modalTitle: never;

    /**
     * The label of the filter button.
     */
    submitLabel: never;

    /**
     * The label of the clear button.
     */
    clearLabel: never;
  }

  interface Actions {
    /**
     * The action to dispatch to load data. Typically this is a `resource.query` action.
     */
    onLoad: never;
  }

  interface EventEmitters {
    /**
     * This event is emitted when new data is available because of a user interaction with filters.
     */
    filtered: never;

    /**
     * This event is emitted when new data is available because of a refresh event.
     */
    refreshed: never;
  }

  interface EventListeners {
    /**
     * Force reload data using the current filters.
     */
    refresh: never;
  }
}
