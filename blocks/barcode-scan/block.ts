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
     * The type of barcode that will be scanned by the block.
     *
     * Choosing 'multiple' will display a dropdown box to show list of code type to select from.
     *
     * It has to be configured according to the code image to allow scanning.
     *
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
     * The type of patch size should depend on the size of code image.
     *
     * Choosing 'multiple' will display a dropdown box to show list of patch size to select from.
     *
     * It has to be configured according to the code image to allow scanning.
     *
     * @default x-large
     */
    patchSize?: 'large' | 'medium' | 'multiple' | 'small' | 'x-large' | 'x-small';

    /**
     * The resolution should allow scanning code to be precise.
     *
     * It has to be configured according to the code image to allow scanning.
     *
     * @default 800
     */
    resolution?: number;

    /**
     * Option to show scanned code
     *
     * @default false
     */
    showBarcode?: boolean;

    /**
     * Type is either camera or file
     *
     * Type 'file' allows to upload code image to scan.
     *
     * Type 'camera' allows to scan code using webcam.
     */
    type: 'camera' | 'file';
  }
}
