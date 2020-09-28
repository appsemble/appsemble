import type { Remapper } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';

/**
 * Represents a column that should be displayed in the table.
 */
export interface Field {
  /**
   * The value of the field.
   */
  value: Remapper;

  /**
   * An optional label used in the header of the table.
   *
   * If this isn’t specified, no label will be shown. If no fields have a label, the table header
   * row won’t be shown.
   */
  label?: Remapper;

  /**
   * The name of the action to trigger when clicking on this field.
   *
   * @format action
   */
  onClick?: string;
}

export interface Dropdown {
  /**
   * An optional label used in the header of the table.
   *
   * If this isn’t specified, no label will be shown. If no fields have a label, the table header
   * row won’t be shown.
   */
  label?: Remapper;

  dropdown: {
    /**
     * The text to show in the dropdown button.
     */
    label?: Remapper;

    /**
     * The icon to show in the dropdown button.
     */
    icon?: IconName;

    /**
     * The list of options to display. Must have at least 1 option.
     *
     * @minimum 1
     */
    options: DropdownOption[];
  };
}

export interface DropdownOption {
  /**
   * The text to show in the option.
   */
  label?: Remapper;

  /**
   * The icon to show in the option.
   */
  icon?: IconName;

  /**
   * The action that will be called when selecting this option.
   *
   * @format action
   */
  onClick: string;
}

/**
 * Repeated fields based on an input array.
 *
 * Only one repeated field is allowed, only the first RepeatedField is considered.
 */
export interface RepeatedField {
  /**
   * The list of fields that should be repeated for each array item.
   */
  repeat: (Field | Dropdown)[];

  /**
   * The value to use as the base of the repeated field.
   *
   * Should be an array of data.
   */
  value: Remapper;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * A message to display when data could not be loaded.
     *
     * @default 'An error occurred when fetching the data'
     */
    errorMessage?: Remapper;

    /**
     * A message to display when the data to display is empty.
     *
     * @default 'No data is available'
     */
    emptyMessage?: Remapper;

    /**
     * A list of fields to display.
     */
    fields: (Field | RepeatedField | Dropdown)[];
  }

  interface Actions {
    /**
     * The default action that is triggered when clicking on a row.
     *
     * This does not trigger if the field has a different action specified.
     */
    onClick: never;

    /**
     * Custom action mapping.
     */
    [key: string]: never;
  }

  interface EventListeners {
    /**
     * Listener for data used to display data in the table.
     */
    data: never;
  }
}
