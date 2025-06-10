import { type ComponentType } from 'react';

export type TrainingStatus = 'available' | 'blocked' | 'completed' | 'in progress';

/**
 * Training chapter after it's been processed. This gets used in the training tree itself.
 */
export interface TrainingChapter {
  /**
   * ID of the chapter.
   */
  id: string;

  /**
   * Title of the chapter
   */
  title: string;

  /**
   * List of trainings that make up this chapter.
   */
  trainings: Training[];

  /**
   * The ID of the chapter that has to be completed before this one can be accessed. Can also be an
   * array if multiple chapters block this one.
   */
  blockedBy?: string[] | string;

  /**
   * The status of the chapter
   */
  status: TrainingStatus;
}

/**
 * Properties of an individual training module.
 */
export interface Training {
  /**
   * Id of the training.
   */
  id: string;

  /**
   * Title of the training
   */
  title: string;

  /**
   * The path of the training page to route to.
   */
  path: string;

  /**
   * The content of the training to render.
   */
  content?: ComponentType;

  /**
   * The status of the training
   */
  status: TrainingStatus;
}

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
