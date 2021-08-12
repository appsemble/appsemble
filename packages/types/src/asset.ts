export interface Asset {
  /**
   * The unique ID of the asset.
   */
  id: string;

  /**
   * The mime type of the asset.
   */
  mime: string;

  /**
   * The filename of the asset as it was uploaded.
   */
  filename?: string;

  /**
   * A custom name that was given to the asset.
   */
  name?: string;
}
