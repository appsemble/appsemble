import { type BulmaColor, type BulmaSize, type IconName, type Remapper } from '@appsemble/sdk';

/**
 * An object representing how a data field should be displayed.
 */
export interface Field {
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
 * A generic interface for data with an ID field.
 */
export interface Item {
  id?: number;
}

export interface Button {
  /**
   * The color of the button.
   *
   * @default "primary"
   */
  color?: BulmaColor;

  /**
   * Whether the button should be disabled.
   *
   * If the resulting remapper value is truthy, the button will be disabled.
   */
  disabled?: Remapper;

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
   * The name of the action to trigger when clicking on this field.
   *
   * @format action
   */
  onClick?: string;

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
}

export interface Dropdown {
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

  /**
   * How the dropdown should be aligned.
   *
   * @default 'right'
   */
  alignment?: 'left' | 'right';
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

declare module '@appsemble/sdk' {
  interface Messages {
    /**
     * The text that is shown when no data was found.
     */
    noData: never;

    /**
     * The text that is shown when something went wrong with fetching the data.
     */
    error: never;
  }

  interface Parameters {
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
     * An optional name of the field that contains the data.
     *
     * If not defined, received data will be treated as an array.
     */
    base?: string;

    /**
     * A list of fields to display.
     */
    fields?: Field[];

    /**
     * The image that is shown to the left of the list item.
     *
     * This can be either a full image path or an asset id.
     */
    image?: Remapper;

    /**
     * The definition of the contents and styling of the button.
     */
    button?: Button;

    /**
     * The definition of the contents and styling of the dropdown.
     */
    dropdown?: Dropdown;
  }

  interface Actions {
    /**
     * Action that gets triggered when clicking on a list item.
     *
     * If defined, an indicator will show up to show that the list item has a click action.
     */
    onClick: never;

    /**
     * Custom action mapping.
     */
    [key: string]: never;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed. Must be a set of data.
     */
    data: never;
  }
}
