declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * This event can be used to receive incoming data to display.
     */
    data: never;
  }

  interface Parameters {
    /**
     * Shape of the wordcloud.
     *
     * @default 'circle'
     */
    shape:
      | 'cardioid'
      | 'circle'
      | 'diamond'
      | 'pentagon'
      | 'square'
      | 'star'
      | 'triangle-forward'
      | 'triangle';
    /**
     * A list of fields to render out in a table.
     */
    fields: Remapper[] | string[];

    /**
     * List of options for rendering the wordcloud.
     */
    options: Options;
  }

  export interface Options {
    /**
     * The font the wordcloud words use.
     */
    fontFamily?: string | undefined;

    /**
     * Font weight to use, e.g. normal, bold or 600
     */
    fontWeight?: number | string | undefined;

    /**
     * Color of the text, can be any CSS color
     * You may also specify colors with built-in * keywords: random-dark and random-light.
     *
     * @default #000000
     */
    color?: string | undefined;

    /**
     * Number to multiply the word size by.
     */
    weightFactor?: number | undefined;

    /**
     * The background color for the wordcloud.
     */
    backgroundColor?: string | undefined;

    /**
     * Minimum font size to draw on the canvas.
     */
    minSize?: number | undefined;

    /**
     * Paint the entire canvas with background color and consider it empty before start.
     */
    clearCanvas?: boolean | undefined;

    /**
     * If the word should rotate, the minimum rotation (in rad) the text should rotate.
     */
    minRotation?: number | undefined;

    /**
     * If the word should rotate, the maximum rotation (in rad) the text should rotate.
     * Set the two value equal to  keep all text in one angle.
     */
    maxRotation?: number | undefined;

    /**
     * Probability for the word to rotate. Set the number to 1 to always rotate.
     *
     * @default 0
     */
    rotateRatio?: number | undefined;

    /**
     * Shuffle the points to draw so the result will be different each time
     * for the same list and settings.
     */
    shuffle?: boolean | undefined;
  }

  interface Messages {
    /**
     * This message is displayed if the data is empty.
     */
    empty: never;

    /**
     * This message is displayed if there was a problem loading the data.
     */
    error: never;

    /**
     * This message is displayed if no data has been loaded yet.
     */
    loading: never;
    /**
     * This message is displayed if the browser does not support the block
     */
    unsupported: never;
  }
}
export {};
