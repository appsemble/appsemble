import { Author } from './author';

/**
 * A snapshot of an app.
 */
export interface Snapshot {
  /**
   * The unique id of the snapshot.
   */
  id: number;

  /**
   * When the snapshot was created.
   */
  $created: Date | string;

  /**
   * The snapshot author.
   */
  $author: Author;

  /**
   * The app definition code represented by this snapshot.
   */
  yaml?: string;
}
