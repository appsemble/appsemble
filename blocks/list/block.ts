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

interface HeaderWithTitles {
  /**
   * The title of the list item
   */
  title: Remapper;

  /**
   * The subtitle of the list item
   */
  subtitle?: Remapper;
}

interface HeaderWithImage {
  /**
   * The image that is shown in the header before the titles.
   *
   * This can be either a full image path or an asset id.
   *
   * Cannot be set in combination with icon.
   */
  image: Image;
}

interface HeaderWithIcon {
  /**
   * The icon that is shown in the header before the titles.
   *
   * Cannot be set in combination with image.
   */
  icon: IconName;
}

interface HeaderWithAssetIcon {
  /**
   * If this is set, the list header will try to fetch an asset with id equal to the header title.
   *
   * If such an asset is found,
   * an icon with its mimetype will be shown in the header before the titles.
   */
  showAssetIcon: true;
}

interface HeaderWithButton {
  /**
   * The definition of the contents and styling of the button in the header.
   *
   * Cannot be set in combination with toggleButton or dropdown.
   */
  button: Button;
}

interface HeaderWithToggleButton {
  /**
   * The definition of the contents and styling of the toggle button in the header.
   *
   * Cannot be set in combination with button or dropdown.
   */
  toggleButton: ToggleButton;
}

interface HeaderWithDropdown {
  /**
   * The definition of the contents and styling of the dropdown in the header.
   *
   * Cannot be set in combination with button or toggleButton.
   */
  dropdown: Dropdown;
}

type Header =
  | HeaderWithAssetIcon
  | HeaderWithButton
  | HeaderWithDropdown
  | HeaderWithIcon
  | HeaderWithImage
  | HeaderWithTitles
  | HeaderWithToggleButton
  | (HeaderWithAssetIcon & HeaderWithButton)
  | (HeaderWithAssetIcon & HeaderWithButton & HeaderWithTitles)
  | (HeaderWithAssetIcon & HeaderWithDropdown)
  | (HeaderWithAssetIcon & HeaderWithDropdown & HeaderWithTitles)
  | (HeaderWithAssetIcon & HeaderWithTitles)
  | (HeaderWithButton & HeaderWithIcon)
  | (HeaderWithButton & HeaderWithIcon & HeaderWithTitles)
  | (HeaderWithButton & HeaderWithImage)
  | (HeaderWithButton & HeaderWithImage & HeaderWithTitles)
  | (HeaderWithButton & HeaderWithTitles)
  | (HeaderWithDropdown & HeaderWithIcon)
  | (HeaderWithDropdown & HeaderWithIcon & HeaderWithTitles)
  | (HeaderWithDropdown & HeaderWithImage)
  | (HeaderWithDropdown & HeaderWithImage & HeaderWithTitles)
  | (HeaderWithDropdown & HeaderWithTitles)
  | (HeaderWithIcon & HeaderWithTitles)
  | (HeaderWithIcon & HeaderWithTitles & HeaderWithToggleButton)
  | (HeaderWithIcon & HeaderWithToggleButton)
  | (HeaderWithImage & HeaderWithTitles)
  | (HeaderWithImage & HeaderWithTitles & HeaderWithToggleButton)
  | (HeaderWithImage & HeaderWithToggleButton)
  | (HeaderWithTitles & HeaderWithToggleButton);

interface ContentWithFields {
  /**
   * A list of fields to display between the header and the footer.
   */
  fields: Field[];
}

interface ContentWithImage {
  /**
   * The image to be shown on the left of the fields in the list item content.
   */
  image: Image;
}

type Content = ContentWithFields | ContentWithImage | (ContentWithFields & ContentWithImage);

interface FooterWithContent {
  /**
   * The content to be shown in the footer
   */
  content: Remapper;
}

interface FooterWithButton {
  /**
   * The definition of the contents and styling of the button in the footer.
   *
   * Cannot be set in combination with toggleButton or dropdown.
   */
  button: Button;
}

interface FooterWithToggleButton {
  /**
   * The definition of the contents and styling of the toggle button in the footer.
   *
   * Cannot be set in combination with button or dropdown.
   */
  toggleButton: ToggleButton;
}

interface FooterWithDropdown {
  /**
   * The definition of the contents and styling of the dropdown in the footer.
   *
   * Cannot be set in combination with button or toggleButton.
   */
  dropdown: Dropdown;
}

type Footer =
  | FooterWithButton
  | FooterWithContent
  | FooterWithDropdown
  | FooterWithToggleButton
  | (FooterWithButton & FooterWithContent)
  | (FooterWithContent & FooterWithDropdown)
  | (FooterWithContent & FooterWithToggleButton);

interface ItemDefinition {
  /**
   * Optional header for the list item
   */
  header?: Header;

  /**
   * Optional content for the list item
   */
  content?: Content;

  /**
   * Optional footer for the list item
   */
  footer?: Footer;
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
     * The properties that describe what an item will look like in the list
     */
    item: ItemDefinition;

    /**
     * An optional name of the field that contains the data.
     *
     * If not defined, received data will be treated as an array.
     */
    base?: string;

    /**
     * Whether items should be appended at the end of the list instead of replace the existing ones
     */
    appendData?: boolean;
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

    /**
     * The event that resets the list.
     *
     * Commonly used with a filter.
     */
    reset: never;
  }
}
