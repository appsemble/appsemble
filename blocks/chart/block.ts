import { Remapper } from '@appsemble/sdk';

/**
 * A hexadecimal color.
 *
 * @pattern ^#[a-fA-F\d]{6}$
 */
type Color = string;

export interface YAxis {
  /**
   * The minimal value to render on the vertical axis.
   *
   * @default 0
   */
  min?: number;

  /**
   * The maximum value to render on the vertical axis.
   *
   * If not specified, the maximum value is determined automatically based on the values given.
   */
  max?: number;

  /**
   * If specified, the Y-axis of the chart will be incremented by this fixed amount.
   *
   * By default it’s detected automatically.
   */
  step?: number;

  /**
   *
   * By default a grey tone is used.
   *
   * @default ['#ededed']
   * @minItems 1
   */
  colors?: Color[];
}

declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * Add new data to the chart.
     *
     * Refer to the block description for more information on the supported data format.
     */
    add: never;

    /**
     * Replace all current data with the new data.
     *
     * Refer to the block description for more information on the supported data format.
     */
    replace: never;
  }

  interface Parameters {
    /**
     * The chart type to render by default.
     *
     * @default 'line'
     */
    type: 'bar' | 'line';

    /**
     * The labels to display at the bottom of the chart.
     *
     * @minItems 1
     */
    labels?: Remapper[];

    /**
     * The background colors to use for each dataset by default.
     *
     * If the length of this array exceeds the number of labels, the pattern will be repeated.
     *
     * By default the primary color of the theme will be used.
     *
     * @minItems 1
     */
    backgroundColors?: Remapper[];

    /**
     * Configuration options for the vertical axis.
     */
    yAxis: YAxis;
  }

  interface Actions {
    /**
     * This action is launched whenever a user clicks on the chart canvas.
     *
     * Returns the data of the clicked data in the format of `label`, `data`.
     *
     * Returns an empty object if the user clicks outside of a data entry.
     */
    onClick?: never;
  }
}
