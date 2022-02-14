import { Remapper } from '@appsemble/sdk';

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
    labels: Remapper[];

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
  }
}
