import { BulmaColor, BulmaSize, Remapper } from '@appsemble/sdk';
import { IconName } from '@fortawesome/fontawesome-common-types';

export interface Button {
  /**
   * The label to display.
   *
   * Will not render if undefined.
   */
  label?: Remapper;

  /**
   * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to render on the button.
   *
   * Will not render if undefined.
   */
  icon?: IconName;

  /**
   * The name of the action to trigger when the button is clicked.
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
    /**
     * The list of buttons.
     */
    buttons: Button[];
  }

  interface Actions {
    /**
     * Action that gets dispatched when a button is clicked that doesn’t specify its own click
     * action.
     */
    onClick: never;

    /**
     * A custom action that gets dispatched when a button is clicked that has the same click action
     * specified as the name of this action.
     */
    [key: string]: never;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * This data can be used with remap to display labels dynamically based on the received data.
     */
    data: never;
  }
}
