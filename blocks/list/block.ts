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

  [key: string]: unknown;
}

export interface Button {
  /**
   * How the button should be aligned.
   *
   * @default 'top-right'
   */
  alignment?: 'bottom-right' | 'field' | 'top-right';

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

export interface ToggleButton {
  /**
   * Value should be true or false.
   */
  value: Remapper;

  /**
   * The button to show when value is set to true.
   */
  trueButton: Button;

  /**
   * The button to show when value is set to false.
   */
  falseButton: Button;
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
   * @default 'bottom-right'
   */
  alignment?: 'bottom-right' | 'top-right';
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

  /**
   * The aspect ratio the image should be displayed in.
   *
   * @default square
   */
  aspectRatio?: '4:3' | '9:16' | '16:9' | 'square';
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
     * The title to display above the list.
     */
    title?: Remapper;

    /**
     * Whether the list or the grouped lists should be collapsible.
     *
     * Will show the title in the collapse button if this is true.
     */
    collapsible?: boolean;

    /**
     * Whether the list should start in a collapsed state.
     *
     * Will only apply to the first list in grouped lists.
     */
    startCollapsed?: boolean;

    /**
     * The property based on which the list should be split into multiple lists.
     */
    groupBy?: string;

    /**
     * Whether the list should be hidden if there is no data.
     *
     * Will not hide if undefined.
     */
    hideOnNoData?: boolean;

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
    image?: Image;

    /**
     * Nests image on the left inside the inline block.
     */
    imageInline?: boolean;

    /**
     * The definition of the contents and styling of the button.
     */
    button?: Button;

    /**
     * The definition of the contents and styling of the toggle button.
     */
    toggleButton?: ToggleButton;

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
     * Action that gets triggered when you drag and drop an item,
     * If you define this action the list items will be draggable.
     */
    onDrop: never;

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
