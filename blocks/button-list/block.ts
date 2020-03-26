import { BulmaColor, BulmaSize } from '@appsemble/sdk';
import { IconName } from '@fortawesome/fontawesome-common-types';

export interface Button {
  /**
   * The label to display.
   *
   * Will not render if undefined.
   */
  label?: string;

  /**
   * The FontAwesome icon to display in front of the label.
   *
   * Will not render if undefined.
   */
  icon?: IconName;

  /**
   * The name of the action to trigger when clicked.
   *
   * @format action
   */
  onClick?: string;

  /**
   * The Bulma color to use.
   */
  color?: BulmaColor;

  /**
   * When set to true, the ‘light’ set of Bulma colors are used.
   */
  light?: boolean;

  /**
   * The size of the button. By default the size is ‘normal’.
   */
  size?: BulmaSize;

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
}

declare module '@appsemble/sdk' {
  interface Parameters {
    buttons: Button[];
  }

  interface Actions {
    /**
     * Generic action that is assigned to buttons by default
     */
    onClick: {};

    /**
     * Custom button mapping
     */
    [key: string]: {};
  }

  interface EventListeners {
    /**
     * Optional data listener.
     */
    data: {};
  }
}
