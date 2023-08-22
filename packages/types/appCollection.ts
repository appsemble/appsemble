export type AppCollectionVisibility = 'private' | 'public';

export interface AppCollection {
  /**
   * The unique ID of the collection.
   */
  id: number;

  /**
   * The name of the app collection.
   */
  name: string;

  /**
   * The id of the organization this app collection belongs to.
   */
  OrganizationId: string;

  /**
   * The name of the organization this app collection belongs to.
   */
  OrganizationName?: string;

  /**
   * The visibility of the app collection.
   */
  visibility: AppCollectionVisibility;

  /**
   * The app collection's expert/curator.
   */
  $expert: {
    /**
     * The expert's name.
     */
    name: string;

    /**
     * The expert's personal description.
     */
    description?: string;

    /**
     * The URL at which the expert's profile image can be found.
     */
    profileImage: string;
  };

  /**
   * The URL at which the app collection's header image can be found.
   */
  headerImage: string;

  /**
   * A domain name on which this app collection should be served.
   */
  domain?: string;

  /**
   * When the collection was first created as an ISO 8601 formatted string.
   */
  $created?: string;

  /**
   * When the collection was last updated as an ISO 8601 formatted string.
   */
  $updated?: string;
}
