import { type JsonObject } from 'type-fest';

import { type ActionDefinition } from './action.js';
import { type Remapper } from './remapper.js';
import { type ViewRole } from './roles.js';
import { type Theme } from './theme.js';

/**
 * A project that is loaded in an app
 */
export interface ControllerDefinition {
  /**
   * A mapping of actions that can be fired by the project to action handlers.
   *
   * The exact meaning of the parameters depends on the project.
   */
  actions?: Record<string, ActionDefinition>;

  /**
   * Mapping of the events the project can listen to and emit.
   *
   * The exact meaning of the parameters depends on the project.
   */
  events?: {
    listen?: Record<string, string>;
    emit?: Record<string, string>;
  };
}

/**
 * A block that is displayed on a page.
 */
export interface BlockDefinition extends ControllerDefinition {
  /**
   * The type of the controller.
   *
   * A block type follow the format `@organization/project`.
   * If the organization is _appsemble_, it may be omitted.
   *
   * Pattern:
   * ^(@[a-z]([a-z\d-]{0,30}[a-z\d])?\/)?[a-z]([a-z\d-]{0,30}[a-z\d])$
   *
   * Examples:
   * - `empty`
   * - `@amsterdam/empty`
   */
  type: string;

  /**
   * A [semver](https://semver.org) representation of the project version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /**
   * An optional header to render above the block.
   */
  header?: Remapper;

  /**
   * An override of the block’s default layout.
   */
  layout?: 'float' | 'grow' | 'static';

  /**
   * For floating blocks this property defines where the block should float.
   */
  position?:
    | 'bottom left'
    | 'bottom right'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top left'
    | 'top right'
    | 'top';

  /**
   * Whether to render the block or not.
   */
  hide?: Remapper;

  /**
   * The theme of the block.
   */
  theme?: Partial<Theme>;

  /**
   * A list of roles that are allowed to view this block.
   */
  roles?: ViewRole[];

  /**
   * A free form mapping of named parameters.
   *
   * The exact meaning of the parameters depends on the project type.
   */
  parameters?: JsonObject;
}
