import { BulmaColor, BulmaSize, IconName, Remapper } from '@appsemble/sdk';

interface BaseField {
  /**
   * An optional label used in the header of the table.
   *
   * If this isn’t specified, no label will be shown. If no fields have a label, the table header
   * row won’t be shown.
   */
  label?: Remapper;

  /**
   * Whether the content of the cell should be aligned left, right, or centered
   */
  alignment?: 'center' | 'left' | 'right';
}

/**
 * Represents a column that should be displayed in the table.
 */
export interface Field extends BaseField {
  /**
   * The value of the field.
   */
  value: Remapper;

  /**
   * The name of the action to trigger when clicking on this field.
   *
   * @format action
   */
  onClick?: string;
}

export interface Button extends BaseField {
  /**
   * The name of the action to trigger when clicking on this field.
   *
   * @format action
   */
  onClick?: string;

  /**
   * The definition of the contents and styling of the button.
   */
  button: {
    /**
     * The color of the button.
     *
     * @default "primary"
     */
    color?: BulmaColor;

    /**
     * The size of the button.
     *
     * @default "normal"
     */
    size?: BulmaSize;

    /**
     * The label to display inside of the button.
     */
    label?: Remapper;

    /**
     * An optional FontAwesome icon to display inside of the button.
     */
    icon?: IconName;

    /**
     * When set to true, the ‘light’ set of Bulma colors are used.
     */
    light?: boolean;

    /**
     * Whether the button should be rounded.
     */
    rounded?: boolean;

    /**
     * Whether the button should be full width or not.
     *
     * By default buttons only take up as much space as needed.
     */
    fullwidth?: boolean;

    /**
     * Whether the text and background colors should be inverted.
     */
    inverted?: boolean;

    /**
     * Whether the button should display its colors in the outlines.
     */
    outlined?: boolean;

    /**
     * The title for the button.
     *
     * Describe what the button does. This helps with accessibility for people using screen readers.
     */
    title?: Remapper;
  };
}

export interface Dropdown extends BaseField {
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
     * @minItems 1
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
   * How the dropdown should be aligned.
   *
   * @default 'right'
   */
  alignment?: 'left' | 'right';

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
  repeat: (Button | Dropdown | Field)[];

  /**
   * The value to use as the base of the repeated field.
   *
   * Should be an array of data.
   */
  value: Remapper;
}

declare module '@appsemble/sdk' {
  interface Messages {
    /**
     * The message to display when data could not be loaded.
     */
    error: never;

    /**
     * The message to display when the data to display is empty.
     */
    emptyMessage: never;
  }
  interface Parameters {
    /**
     * A list of fields to display.
     */
    fields: (Button | Dropdown | Field | RepeatedField)[];
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
