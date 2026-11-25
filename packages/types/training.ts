export type TrainingStatus = 'available' | 'blocked' | 'completed' | 'in progress';

/**
 * Properties of a training chapter as defined in the project files.
 */
export interface TrainingChapterProperties {
  /**
   * The ID of the chapter that has to be completed before this one can be accessed. Can also be an
   * array if multiple chapters block this one.
   */
  blockedBy: string[] | string;

  /**
   * Title of the chapter
   */
  title: string;

  /**
   * The order in which the trainings must be completed
   */
  trainingOrder: string[];
}
