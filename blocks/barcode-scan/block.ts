declare module '@appsemble/sdk' {
  interface EventEmitters {
    /**
     * Event that gets emitted once the barcode scanner has identified and resolved a barcode.
     *
     * barcode event only holds the object with property barcode.
     */
    foundBarcode: never;
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
  }

  interface Parameters {
    /**
     * @default code_128
     */
    barcodeType?:
      | '2of5'
      | 'code_32'
      | 'code_39_vin'
      | 'code_39'
      | 'code_93'
      | 'code_128'
      | 'ean_2'
      | 'ean_5'
      | 'ean_8'
      | 'ean'
      | 'i2of5'
      | 'multiple'
      | 'upc_e'
      | 'upc';

    /**
     * @default x-large
     */
    patchSize?: 'large' | 'medium' | 'multiple' | 'small' | 'x-large' | 'x-small';

    /**
     * @default 800
     */
    resolution?: number;

    /**
     * Type is either camera or file
     */
    type: 'camera' | 'file';
  }
}
