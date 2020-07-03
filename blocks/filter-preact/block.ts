import type { Remapper } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import type { h } from 'preact';

export interface Enum {
  /**
   * The value that gets submitted when filtering.
   */
  value: string;

  /**
   *  User-facing label describing the option.
   */
  label?: string;
}

export interface CheckboxOption {
  /**
   * The value that gets submitted when filtering.
   */
  value: string;

  /**
   *  User-facing label describing the option.
   */
  label?: string;

  icon: IconName;
}

export interface AbstractField {
  name: string;

  /**
   * The label displayed next to the field.
   */
  label?: string;

  /**
   * Name of the [Font Awesome icon](https://fontawesome.com/icons?m=free) to be displayed next to
   * the label.
   */
  icon?: IconName;
}

export interface ButtonsField extends AbstractField {
  type: 'buttons';

  defaultValue?: string[];

  options: CheckboxOption[];
}

export interface DateField extends AbstractField {
  type: 'date';

  defaultValue?: string;
}

export interface DateRangeField extends AbstractField {
  type: 'date-range';

  defaultValue?: [string, string];

  fromLabel?: Remapper;

  toLabel?: Remapper;
}

export interface EnumField extends AbstractField {
  type: 'enum';

  defaultValue?: string;

  enum: Enum[];
}

export interface StringField extends AbstractField {
  type: 'string';

  defaultValue?: string;

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
    fields: Field[];

    highlight?: string;

    modalTitle?: Remapper;

    clearLabel?: Remapper;

    submitLabel?: Remapper;
  }

  interface Actions {
    onLoad: {};
  }

  interface EventEmitters {
    data: {};
  }
}
