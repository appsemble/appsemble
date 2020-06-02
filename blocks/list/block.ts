import type { Remapper } from '@appsemble/sdk';
import type { IconName } from '@fortawesome/fontawesome-common-types';

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

declare module '@appsemble/sdk' {
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
  }

  interface Actions {
    /**
     * Action that gets triggered when clicking on a list item.
     *
     * If defined, an indicator will show up to show that the list item has a click action.
     */
    onClick: {};
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed. Must be a set of data.
     */
    data: {};
  }
}
