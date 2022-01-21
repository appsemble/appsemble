export interface Resource {
  /**
   * The unique ID of the resource
   */
  id: number;

  /**
   * A boolean indicating whether or not the resource will be cloned with the app.
   *
   * This only applies to template apps.
   */
  $clonable: boolean;

  /**
   * When the resource was first created as an ISO 8601 formatted string.
   */
  $created: string;

  /**
   * When the resource was last updated as an ISO 8601 formatted string.
   */
  $updated: string;

  /**
   * The user who initially created the resource.
   */
  $author?: ResourceAuthor;

  /**
   * The user who last updated the resource.
   */
  $editor?: ResourceAuthor;

  /**
   * Any non-reserved properties are allowed on the resource as defined in the app definition.
   */
  [key: string]: unknown;
}

export interface ResourceAuthor {
  /**
   * The user ID of the author.
   */
  id: string;

  /**
   * The display name of the user.
   */
  name: string;
}

export interface ResourceVersion {
  created: string;
  data: Record<string, unknown>;
  author: ResourceAuthor;
}
