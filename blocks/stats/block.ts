import { type IconName, type Remapper } from '@appsemble/sdk';

/**
 * An object describing what a stats field looks like.
 */
export interface Field {
  /**
   * The value of the property to render.
   */
  value: Remapper;

  /**
   * The [Font Awesome icon](https://fontawesome.com/icons?m=free) to render.
   */
  icon: IconName;

  /**
   * The label to render.
   */
  label?: Remapper;
}

declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * On what event to listen for incoming data to display.
     */
    data: never;
  }

  interface Parameters {
    /**
     * A list of objects describing what the stats should look like.
     */
    fields: Field[];
  }
}
