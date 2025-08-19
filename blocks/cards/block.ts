import { type BulmaColor, type BulmaSize, type IconName, type Remapper } from '@appsemble/sdk';

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
   * An FontAwesome icon to display inside of the button.
   *
   * This is the only thing visible on mobile so it's required
   */
  icon: IconName;

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

  /**
   * Whether to hide the button.
   *
   * Useful for conditional rendering.
   */
  hide?: Remapper;
}

interface CardItemDefinition {
  /**
   * Image for the card.
   */
  image?: Image;

  /**
   * Title of the card, appears in bold.
   */
  title?: Remapper;

  /**
   * Subtitle of the card.
   */
  subtitle?: Remapper;

  /**
   * The label to render.
   */
  content: Remapper;

  /**
   * A list of buttons to be rendered as the footer of the card.
   */
  footer?: Button[];
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
 * A generic interface for data with an ID field.
 */
export interface Item {
  id?: number;

  [key: string]: unknown;
}

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * This action is triggered when a card is clicked.
     */
    onClick: never;

    /**
     * Custom action mapping.
     */
    [key: string]: never;
  }

  interface EventListeners {
    /**
     * On what event to listen for incoming data to display.
     */
    data: never;

    /**
     * The event that resets the data.
     *
     * Commonly used with a filter.
     */
    reset: never;
  }

  interface Parameters {
    /**
     * Whether to render the item.
     */
    show?: Remapper;

    /**
     * Whether the cards should be hidden if there is no data.
     *
     * Will not hide if undefined.
     */
    hideOnNoData?: boolean;

    /**
     * An image to fallback on,
     *
     * this can either be an asset name or a URL
     */
    defaultImage: string;

    card: CardItemDefinition;
  }

  interface Messages {
    /**
     * This message is displayed if there was a problem loading the data.
     */
    error: never;

    /**
     * This message is displayed if no data was to be found.
     */
    noData: never;
  }
}
