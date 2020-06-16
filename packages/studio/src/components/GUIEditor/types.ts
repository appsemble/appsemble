import type { Range } from 'monaco-editor';

export interface EditLocation {
  /**
   * The name of the selected block
   */
  blockName: string;

  /**
   * The name of the selected page
   */
  pageName: string;

  /**
   * Each parent of the selected block
   */
  parents?: [{ name: string; line: number; indent: number }];

  /**
   * Monaco Range with the starting and ending line of the selection
   */
  editRange?: Range;
}

/**
 * Every Editor step
 */
export enum GuiEditorStep {
  'YAML',
  'SELECT',
  'ADD',
  'EDIT',
}
