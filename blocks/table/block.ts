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
  label?: string;

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
    onClick: {};

    /**
     * Custom action mapping.
     */
    [key: string]: {};
  }

  interface EventListeners {
    /**
     * Listener for data used to display data in the table.
     */
    data: {};
  }
}
