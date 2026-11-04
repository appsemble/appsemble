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

  /**
   * The ID of the resource the asset is linked to.
   */
  resourceId?: number;

  /**
   * The type of the resource the asset is linked to.
   */
  resourceType?: number;

  /**
   * Whether the asset is a seed asset.
   */
  seed?: boolean;

  /**
   * Whether the asset is transferred when cloning the app.
   */
  clonable?: boolean;

  /**
   * The hex encoded SHA-256 hash of the asset content.
   */
  sha256?: string | null;
}
