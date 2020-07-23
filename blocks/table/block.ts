import type { Remapper } from '@appsemble/sdk';

/**
 * Represents a column that should be displayed in the table.
 */
export interface Field {
  /**
   * The name of the property of the data to fetch from. Supports dot notation.
   */
  name: string;

  /**
   * An optional label used in the header of the table.
   *
   * If this isn’t specified, no label will be shown. If no fields have a label, the table header
   * row won’t be shown.
   */
  label?: Remapper;

  /**
   * The name of the action to trigger when clicking on this field.
   *
   * @format action
   */
  onClick?: string;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * A message to display when data could not be loaded.
     *
     * @default 'An error occurred when fetching the data'
     */
    errorMessage: Remapper;

    /**
     * A message to display when the data to display is empty.
     *
     * @default 'No data is available'
     */
    emptyMessage: Remapper;

    /**
     * A list of fields to display based on the name from the schema.
     */
    fields: Field[];
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
