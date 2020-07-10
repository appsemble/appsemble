import type { Remapper } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import type { h } from 'preact';

export interface EnumOption {
  /**
   * The value that gets submitted when filtering.
   */
  value: string;

  /**
   *  User-facing label describing the option.
   */
  label?: string;
}

export interface ButtonOption {
  /**
   * The value that gets submitted when filtering.
   */
  value: string;

  /**
   *  User-facing label describing the option.
   */
  label?: string;

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
  label?: string;

  /**
   * Name of the [Font Awesome icon](https://fontawesome.com/icons?m=free) to be displayed next to
   * the label.
   */
  icon?: IconName;

  /**
   * The filter to apply by default..
   */
  defaultValue: D;
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

export interface FilterValues {
  [name: string]: FilterValue;
}

export interface FieldComponentProps<F extends Field, T = F['defaultValue']> {
  className?: string;

  field: F;

  highlight?: boolean;

  loading: boolean;

  onChange: (event: h.JSX.TargetedEvent<HTMLElement & { name: string }>, value: T) => void;

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

    /**
     * The title of the modal.
     *
     * @default 'Filter'
     */
    modalTitle?: Remapper;

    /**
     * The label of the clear button.
     *
     * @default 'Clear'
     */
    clearLabel?: Remapper;

    /**
     * The label of the filter button.
     *
     * @default 'Filter'
     */
    submitLabel?: Remapper;
  }

  interface Actions {
    /**
     * The action to dispatch to load data. Typically this is a `resource.query` action.
     */
    onLoad: {};
  }

  interface EventEmitters {
    /**
     * This event is emitted when new filter data is available.
     */
    data: {};
  }
}
