import { type Schema } from 'jsonschema';

export * from './action2.js';
export * from './ActionError.js';
export * from './action.js';
export * from './block.js';
export * from './bulma.js';
export * from './container.js';
export * from './core.js';
export * from './http.js';
export * from './index.js';
export * from './layout.js';
export * from './permission.js';
export * from './remapper.js';
export * from './resource.js';
export * from './roles.js';
export * from './security.js';
export * from './theme.js';
export * from './member.js';

export interface ActionType {
  /**
   * Whether or not app creators are required to define this action.
   */
  required?: boolean;

  /**
   * The description of the action.
   */
  description?: string;
}

export interface EventType {
  /**
   * The description of the action.
   */
  description?: string;
}

export interface ProjectConfig {
  /**
   * The name of the project.
   */
  name: string;

  /**
   * The description of the project.
   */
  description?: string;

  /**
   * The long description of the project.
   *
   * This is displayed when rendering documentation and supports Markdown.
   */
  longDescription?: string;

  /**
   * A [semver](https://semver.org) representation of the project version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;
}

export interface ProjectImplementations {
  /**
   * The actions that are supported by a project.
   */
  actions?: Record<string, ActionType>;

  /**
   * The events that are supported by a project.
   */
  events?: {
    listen?: Record<string, EventType>;
    emit?: Record<string, EventType>;
  };

  /**
   * The messages that are supported by a project.
   */
  messages?: Record<string, Record<string, any> | never>;

  /**
   * A JSON schema to validate project parameters.
   */
  parameters?: Schema;
}

export interface ProjectManifest extends ProjectConfig, ProjectImplementations {
  /**
   * Array of urls associated to the files of the project.
   */
  files: string[];
}

export interface BlockManifest extends ProjectManifest {
  /**
   * The URL that can be used to fetch this block’s icon.
   */
  iconUrl?: string | null;

  /**
   * The languages that are supported by the block by default.
   *
   * If the block has no messages, this property is `null`.
   */
  languages: string[] | null;

  examples?: string[];

  /**
   * Whether the block should be listed publicly
   * for users who aren’t part of the block’s organization.
   *
   * - **`public`**: The block is visible for everyone.
   * - **`unlisted`**: The block will only be visible if the user is
   * logged in and is part of the block’s organization.
   */
  visibility?: 'public' | 'unlisted';

  /**
   * Whether action validation for wildcard action is skipped.
   *
   * If true, ignore unused actions that fall under '$any'.
   */
  wildcardActions?: boolean;

  /**
   * The type of layout to be used for the block.
   */
  layout?: 'float' | 'grow' | 'hidden' | 'static' | null;
}
