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
   * A boolean indicating whether the resource will be used for creating ephemeral
   * resources in demo apps
   */
  $seed: boolean;

  /**
   * A boolean indicating whether the resource will be cleaned up regularly
   */
  $ephemeral: boolean;

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
   * The app group that this resource is scoped to.
   */
  $group?: ResourceGroup;

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
  name?: string;
}

export interface ResourceGroup {
  /**
   * The id of the group.
   */
  id: number;

  /**
   * The name of the group.
   */
  name: string;
}

export interface ResourceVersion {
  created: string;
  data: Record<string, unknown>;
  author?: ResourceAuthor;
}
