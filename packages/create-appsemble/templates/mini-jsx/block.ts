// Blocks can actions, parameters, messages, and event listeners and emitters. These can be defined
// by augmenting the @appsemble/sdk module. Typically this happens in a file named block.ts. When a
// block is published, the CLI will process the augmented interfaces and validate the app definition
// complies with them. The JSDoc will be used to render documentation.
import { type IconName, type Remapper } from '@appsemble/sdk';

/**
 * A field to display.
 */
export interface Field {
  /**
   * The value of the property to render.
   */
  value: Remapper;

  /**
   * The fontawesome icon to render.
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
     * The event to listen on for data to display.
     */
    data: never;
  }

  interface Messages {
    /**
     * This message is displayed when there was an error loading data.
     */
    error: never;
  }

  interface Parameters {
    /**
     * The fields to display.
     */
    fields: Field[];
  }
}
