import type { IconName } from '@fortawesome/fontawesome-common-types';

export interface Enum {
  /**
   * The value that gets submitted when filtering.
   */
  value: string;

  /**
   *  User-facing label describing the option.
   */
  label?: string;

  /**
   * Name of the [Font Awesome icon](https://fontawesome.com/icons?m=free) to be displayed next to
   * the label.
   */
  icon?: IconName;
}

export interface FilterField {
  /**
   * The text to show for empty enum items.
   */
  emptyLabel?: string;

  /**
   * The default value used for the field.
   *
   * If not set, an empty filter option is added to allow for not filtering on this field at all.
   */
  defaultValue?: string | number;

  /**
   * The label displayed next to the field.
   */
  label?: string;

  /**
   * A list of predetermined options the user can pick from.
   */
  enum?: Enum[];

  /**
   * Name of the [Font Awesome icon](https://fontawesome.com/icons?m=free) to be displayed next to
   * the label.
   */
  icon?: IconName;

  /**
   * The name used when storing this field.
   */
  name: string;

  /**
   * Whether a range picker should be used.
   */
  range?: boolean;

  /**
   * The type of the data.
   */
  type: 'date' | 'checkbox' | 'radio' | 'string';

  /**
   * Whether exact matching should be used when matching string values.
   */
  exact?: boolean;
}

export interface RangeFilter {
  from?: string | number;
  to?: string | number;
}

export interface Filter {
  [filter: string]: string | number | RangeFilter | string[];
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * A list of objects describing each field that can be filtered.
     */
    fields: FilterField[];

    /**
     * The field to highlight outside of the filter dialog.
     *
     * If set, changing the highlighted value will immediately apply a new filter
     */
    highlight: string;

    /**
     * The time it seconds between each time the filter should be refreshed automatically.
     *
     * If not set, no automatic refresh will be performed.
     */
    refreshTimeout: number;
  }

  interface Actions {
    /**
     * Action that gets dispatched when a new filter gets applied.
     *
     * This also gets called during the initial load.
     */
    onLoad: {};
  }

  interface EventEmitters {
    /**
     * The event that is emitted when data is finished loading.
     */
    data: {};
  }
}
