import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type OpenAPIV3 } from 'openapi-types';

import { type ActionDefinition } from './actionDefinition.js';
import { type BlockDefinition, type ControllerDefinition } from './block.js';
import { type CompanionContainerDefinition } from './container.js';
import { type LayoutPosition, type Navigation } from './layout.js';
import { type Remapper } from './remapper.js';
import { type ResourceDefinition } from './resource.js';
import { type ViewRole } from './roles.js';
import { type Security } from './security.js';
import { type Theme } from './theme.js';

export type SettingName = 'email' | 'languages' | 'name' | 'password' | 'phoneNumber' | 'picture';

export interface AppDefinition {
  /**
   * The name of the app.
   *
   * This determines the default path of the app.
   */
  name: string;

  /**
   * The description of the app.
   */
  description?: string;

  /**
   * The default language of the app.
   *
   * @default 'en'
   */
  defaultLanguage?: string;

  /**
   * The security definition of the app.
   *
   * This determines user roles and login behavior.
   */
  security?: Security;

  /**
   * The default page of the app.
   */
  defaultPage: string;

  /**
   * The settings for the layout of the app.
   */
  layout?: {
    /**
     * The location of the login button.
     *
     * @default 'navbar'
     */
    login?: LayoutPosition;

    /**
     * The location of the settings button.
     *
     * If set to `navigation`, it will only be visible if `login` is also visible in `navigation`.
     *
     * @default 'navbar'
     */
    settings?: LayoutPosition;

    /**
     * The location of the feedback button
     *
     * If set to `navigation`, it will only be visible if `login` is also visible in `navigation`.
     *
     * @default 'navbar'
     */
    feedback?: LayoutPosition;

    /**
     * The location of the install button.
     *
     * If set to `navigation`, it will only be visible if `login` is also visible in `navigation`.
     *
     * @default 'navbar'
     */
    install?: LayoutPosition;

    /**
     * The location of the debug button.
     *
     * If set to `navigation`, it will only be visible if `login` is also visible in `navigation`.
     *
     * @default 'hidden'
     */
    debug?: LayoutPosition;

    /**
     * Settings to be shown on the default settings page.
     */
    enabledSettings?: SettingName[];

    /**
     * The navigation type to use.
     *
     * If this is omitted, a collapsible side navigation menu will be rendered on the left.
     *
     * @default 'left-menu'
     */
    navigation?: Navigation;

    /**
     * The settings for displaying the app logo.
     */
    logo?: AppLogo;

    /**
     * The settings for displaying a tag in the header.
     */
    headerTag?: HeaderTag;

    /**
     * Whether to display app name or the page name in the title bar, displays pageName by default
     *
     */
    titleBarText?: 'appName' | 'pageName';

    /**
     * Whether to hide the title bar from all pages in the app.
     */
    hideTitleBar?: boolean;
  };

  /**
   * The strategy to use for apps to subscribe to push notifications.
   *
   * If this is omitted, push notifications can not be sent.
   */
  notifications?: 'login' | 'opt-in' | 'startup';

  /**
   * The pages of the app.
   */
  pages: PageDefinition[];

  controller?: ControllerDefinition;

  members?: {
    phoneNumber?: AppMemberPhoneNumberDefinition;
    properties?: Record<string, AppMemberPropertyDefinition>;
  };

  /**
   * Resource definitions that may be used by the app.
   */
  resources?: Record<string, ResourceDefinition>;

  /**
   * The global theme for the app.
   */
  theme?: Partial<Theme>;

  /**
   * Helper property that can be used to store YAML anchors.
   *
   * This is omitted any time the API serves the app definition.
   */
  anchors?: any[];

  /**
   * Cron jobs associated with the app.
   */
  cron?: Record<string, CronDefinition>;

  /**
   * Webhooks associated with the app.
   */
  webhooks?: Record<string, WebhookDefinition>;

  /**
   * Companion containers of the app.
   */
  containers?: CompanionContainerDefinition[];

  /**
   * Default registry to use when creating app companion containers.
   * Used to avoid writing the registry name in front of every image.
   */
  registry?: string;
}

/**
 * This describes what a page will look like in the app.
 */
export interface BasePageDefinition {
  /**
   * The name of the page.
   *
   * This will be displayed at the *app bar* of each page and in the side menu,
   * unless @see navTitle is set.
   *
   * The name of the page is used to determine the URL path of the page.
   */
  name: string;

  /**
   * Whether or not the page name should be displayed in the *app bar*.
   */
  hideName?: boolean;

  /**
   * The name of the page when displayed in the navigation menu.
   *
   * Context property `name` can be used to access the name of the page.
   */
  navTitle?: Remapper;

  /**
   * Whether or not the page should be displayed in navigational menus.
   */
  hideNavTitle?: boolean;

  /**
   * The navigation type to use for the page.
   * Setting this will override the default navigation for the app.
   * if this is set to `navbar`, navigation link is rendered in the profile dropdown.
   */
  navigation?: Navigation | 'profileDropdown';

  /**
   * A list of roles that may view the page.
   */
  roles?: ViewRole[];

  /**
   * An optional icon from the fontawesome icon set
   *
   * This will be displayed in the navigation menu.
   */
  icon?: IconName;

  /**
   * Page parameters can be used for linking to a page that should display a single resource.
   */
  parameters?: string[];

  /**
   * The global theme for the page.
   */
  theme?: Partial<Theme>;

  /**
   * A Remapper that resolves to a number to be visible in the side-menu.
   */
  badgeCount?: Remapper;

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onLoad?: ActionDefinition;
  };
}

/**
 * A subset of page for use within flow pages and tab pages.
 */
export interface SubPageDefinition {
  name: Remapper;
  roles?: ViewRole[];
  blocks: BlockDefinition[];
}

export interface BasicPageDefinition extends BasePageDefinition {
  type?: 'page';
  blocks: BlockDefinition[];
}

export interface ContainerPageDefinition extends BasePageDefinition {
  type: 'container';
  pages: PageDefinition[];
}

export interface FlowPageDefinition extends Omit<BasePageDefinition, 'actions'> {
  type: 'flow';

  steps: SubPageDefinition[];

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onLoad?: ActionDefinition;
    onFlowCancel?: ActionDefinition;
    onFlowFinish?: ActionDefinition;
  };

  /**
   * The method used to display the progress of the flow page.
   *
   * @default 'corner-dots'
   */
  progress?: 'corner-dots' | 'hidden';

  /**
   * Whether to retain the flow data when navigating away to another page outside the flow.
   *
   * By default the flow page retains it's data after navigating once. Set to false to clear it.
   *
   * @default true
   */
  retainFlowData?: boolean;
}

export interface LoopPageDefinition extends BasePageDefinition {
  type: 'loop';

  /**
   * Template step that the loop will pass data onto
   */
  foreach: SubPageDefinition;

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onFlowCancel?: ActionDefinition;
    onFlowFinish?: ActionDefinition;
    onLoad: ActionDefinition;
  };

  /**
   * The method used to display the progress of the flow page.
   *
   * @default 'corner-dots'
   */
  progress?: 'corner-dots' | 'hidden';

  /**
   * Whether to retain the flow data when navigating away to another page outside the flow.
   *
   * By default the flow page retains it's data after navigating once. Set to false to clear it.
   *
   * @default true
   */
  retainFlowData?: boolean;
}

export interface AlternateTabsDefinition {
  foreach: SubPageDefinition;
  events: {
    listen?: Record<string, string>;
    emit?: Record<string, string>;
  };
}

export interface TabsPageDefinition extends BasePageDefinition {
  type: 'tabs';
  tabs?: SubPageDefinition[];
  definition?: AlternateTabsDefinition;

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onLoad?: ActionDefinition;
  };
}

export type PageDefinition =
  | BasicPageDefinition
  | ContainerPageDefinition
  | FlowPageDefinition
  | LoopPageDefinition
  | TabsPageDefinition;

/**
 * The definition of a cron job for an app.
 */
export interface CronDefinition {
  schedule: string;
  action: ActionDefinition;
}

/**
 * The definition of a webhook for an app.
 */
export interface WebhookDefinition {
  schema: OpenAPIV3.SchemaObject;
  action: ActionDefinition;
}

export interface AppMemberPhoneNumberDefinition {
  enable: boolean;
  required?: boolean;
}

export interface AppMemberPropertyDefinition {
  /**
   * The JSON schema to validate user properties against before sending it to the backend.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The resource that is referenced by this user property.
   */
  reference?: {
    resource: string;
  };
}

export interface HeaderTag {
  /**
   * The text to be displayed in the tag.
   */
  text: Remapper;

  /**
   * Whether to hide the tag.
   */
  hide: Remapper;
}

export interface AppLogo {
  /**
   * The location of the logo
   *
   * @default hidden
   */
  position?: 'hidden' | 'navbar';

  /**
   * The id or name of the app asset to use for the logo
   *
   * @default logo
   */
  asset?: string;
}
