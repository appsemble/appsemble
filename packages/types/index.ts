import {
  type ActionType,
  type AppDefinition,
  type AppMemberInfo,
  type AppRole,
  type BlockManifest,
  type EventType,
  type ProjectConfig,
  type ProjectImplementations,
  type ProjectManifest,
  type Remapper,
} from '@appsemble/lang-sdk';
import { type IconName } from '@fortawesome/fontawesome-common-types';

import { type AppVisibility } from './app.js';
import { type PredefinedOrganizationRole } from './roles.js';

export * from './app.js';
export * from './asset.js';
export * from './authentication.js';
export * from './author.js';
export * from './bulma.js';
export * from './appCollection.js';
export * from './cli.js';
export * from './snapshot.js';
export * from './resource.js';
export * from './saml.js';
export * from './ssl.js';
export * from './template.js';
export * from './oauth2.js';
export * from './training.js';
export * from './quota.js';
export * from './permissions.js';
export * from './roles.js';

// XXX: consider not re-exporting from here
export type { AppMemberInfo };
export type { ProjectImplementations, BlockManifest, ProjectManifest, ActionType, EventType };

/**
 * A representation of a generated OAuth2 authorization code response.
 */
export interface OAuth2AuthorizationCode {
  /**
   * The authorization code.
   */
  code: string;
}

/**
 * OpenID Connect specifies a set of standard claims about the end-user, which cover common profile
 * information such as name, contact details, date of birth and locale.
 *
 * The Connect2id server can be set up to provide additional custom claims, such as roles and
 * permissions.
 */
export interface BaseUserInfo {
  /**
   * The subject (end-user) identifier. This member is always present in a claims set.
   */
  sub: string;

  /**
   * The full name of the end-user, with optional language tag.
   */
  name: string;

  /**
   * The end-user's preferred email address.
   */
  email: string;

  /**
   * True if the end-user's email address has been verified, else false.
   */
  email_verified: boolean;

  /**
   * The URL of the profile picture for the end-user.
   */
  picture?: string;

  /**
   * The end-user’s locale, represented as a BCP47 language tag.
   */
  locale?: string;

  /**
   * The end-user’s time zone.
   */
  zoneinfo?: string;
}

const assertAppMemberInfoIsBaseUserInfo: AppMemberInfo extends BaseUserInfo ? true : false = true;
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
assertAppMemberInfoIsBaseUserInfo;

export interface UserInfo extends BaseUserInfo {
  /**
   * If the user is subscribed to the newsletter
   */
  subscribed?: boolean;
  hasPassword?: boolean;
}

export interface SSOConfiguration {
  type: 'oauth2' | 'saml';
  url: string;
  icon: IconName;
  name: string;
}

export interface AppAccount {
  app: App;
  appMemberInfo: AppMemberInfo;
  sso: SSOConfiguration[];
}

export interface EmailAuthorization {
  email: string;
  verified: boolean;
}

/**
 * The payload stored in our JSON web tokens
 */
export interface JwtPayload {
  aud: string;
  exp: number;
  iat: string;
  iss: string;
  scope: string;
  sub: string;
}

/**
 * A response for a login token request
 */
export interface TokenResponse {
  /**
   * The bearer access token to use for authenticating requests.
   */
  access_token: string;

  /**
   * How long until the access token expires in seconds from now.
   */
  expires_in?: number;

  /**
   * The OpenID ID token as a JWT.
   *
   * This field is only present on OpenID connect providers.
   */
  id_token?: string;

  /**
   * A refresh token for getting a new access token.
   */
  refresh_token?: string;

  token_type: 'bearer';
}

/**
 * A type to represent the app lock.
 */
export type AppLock = 'fullLock' | 'studioLock' | 'unlocked';

export interface SubscriptionResponseResource {
  create: boolean;
  update: boolean;
  delete: boolean;
  subscriptions?: Record<
    string,
    {
      create?: boolean;
      update: boolean;
      delete: boolean;
    }
  >;
}

export type SubscriptionResponse = Record<string, SubscriptionResponseResource>;

export const resourceSubscribableAction = ['create', 'update', 'delete'] as const;

export type ResourceSubscribableAction = (typeof resourceSubscribableAction)[number];

export interface App {
  /**
   * The unique identifier for the app.
   *
   * This value will be generated automatically by the API.
   */
  id?: number;

  /**
   * A domain name on which this app should be served.
   */
  domain?: string | null;

  /**
   * The name used for emails
   */
  emailName?: string;

  /**
   * The id of the organization this app belongs to.
   */
  OrganizationId: string;

  /**
   * The name of the organization this app belongs to.
   */
  OrganizationName?: string;

  /**
   * The path the app is available from.
   */
  path: string;

  /**
   * Visibility of the app in the public app store.
   */
  visibility: AppVisibility;

  /**
   * Whether or not the app definition is exposed for display in Appsemble Studio.
   */
  showAppDefinition: boolean;

  /**
   * The Google analytics ID of the app.
   */
  googleAnalyticsID?: string;

  /**
   * Whether the app is currently locked.
   */
  locked: AppLock;

  /**
   * Whether the app is a template.
   */
  template?: boolean;

  /**
   * Whether to apply service secrets to outgoing request even without a security definition.
   */
  enableUnsecuredServiceSecrets: boolean;

  /**
   * Whether the Appsemble password login method should be shown.
   */
  showAppsembleLogin: boolean;

  /**
   * Whether to display App member's name in the title bar.
   */
  displayAppMemberName: boolean;

  /**
   * Whether to display the installation prompt to the app members.
   */
  displayInstallationPrompt: boolean;

  /**
   * Whether the Appsemble OAuth2 login method should be shown.
   */
  showAppsembleOAuth2Login: boolean;

  /**
   * Whether new users should be able to register themselves.
   */
  enableSelfRegistration: boolean;

  /**
   * The Sentry DSN of the app.
   */
  sentryDsn?: string;

  /**
   * The Sentry environment associated with the Sentry DSN.
   */
  sentryEnvironment?: string;

  /**
   * The app definition.
   */
  definition: AppDefinition;

  /**
   * The app definition formatted as YAML.
   */
  yaml?: string;

  /**
   * An app rating.
   */
  rating?: {
    /**
     * The number of people who rated the app.
     */
    count: number;

    /**
     * The average app rating.
     */
    average: number;
  };

  /**
   * Whether the app has clonable resources.
   */
  hasClonableResources?: boolean;

  /**
   * Whether the app has clonable assets.
   */
  hasClonableAssets?: boolean;

  /**
   * A list of URLs to app screenshots
   */
  screenshotUrls?: string[];

  /**
   * A URL to the long description of the app based on language
   */
  readmeUrl?: string;

  /**
   * True if the app has its own icon.
   */
  hasIcon: boolean;

  /**
   * True if the app supports a maskable icon.
   */
  hasMaskableIcon: boolean;

  /**
   * The background color used for maskable icons.
   */
  iconBackground: string;

  /**
   * An app icon url
   */
  iconUrl?: string;

  /**
   * The creation date of the app.
   */
  $created?: string;

  /**
   * The date when the app was last updated.
   */
  $updated?: string;

  /**
   * Any pre-included translations of the app.
   */
  messages?: AppsembleMessages;

  /**
   * The build app controller's code
   */
  controllerCode?: string;

  /**
   * The build app controller's manifest
   */
  controllerImplementations?: ProjectImplementations;

  /**
   * Any app styles that are shared.
   */
  sharedStyle?: string;

  /**
   * Any app styles that are core.
   */
  coreStyle?: string;

  /**
   * Whether the app should be used in demo mode.
   */
  demoMode: boolean;

  /**
   * Whether to skip sending group invite emails when adding group members.
   *
   * If set to true, group members are added directly to the group.
   */
  skipGroupInvites?: boolean;
}

/**
 * A rating given to an app.
 */
export interface Rating {
  /**
   * A value ranging between 1 and 5 representing the rating
   */
  rating: number;

  /**
   * An optional description of why the rating was given
   */
  description?: string;

  /**
   * The name of the user who rated the app.
   */
  name: string;

  /**
   * The ID of the user who rated the app.
   */
  UserId: string;

  /**
   * The creation date of the rating.
   */
  $created: string;

  /**
   * The date of the last time the rating was updated
   */
  $updated: string;
}

/**
 * The representation of an organization within Appsemble.
 */
export interface Organization {
  /**
   * The ID of the organization.
   *
   * This typically is prepended with an `@`
   */
  id: string;

  /**
   * The display name of the organization.
   */
  name: string;

  /**
   * The description of the organization.
   */
  description: string;

  /**
   * The website of the organization.
   */
  website: string;

  /**
   * The email address that can be used to contact the organization.
   */
  email: string;

  /**
   * The URL at which the organization’s icon can be found.
   */
  iconUrl: string;
}

/**
 * An invite for an organization.
 */
export interface OrganizationInvite {
  /**
   * The email address of the user to invite.
   */
  email: string;

  /**
   * The role the user should get when accepting the invite.
   */
  role: PredefinedOrganizationRole;
}

/**
 * An invite for an app.
 */
export interface AppInvite {
  /**
   * The email address of the app member to invite.
   */
  email: string;

  /**
   * The role the app member should get when accepting the invite.
   */
  role: string;
}

/**
 * An invite for a group.
 */
export interface GroupInvite {
  /**
   * The name of the group.
   */
  groupId?: number;

  /**
   * The name of the group.
   */
  groupName?: string;

  /**
   * The email address of the group member to invite.
   */
  email: string;

  /**
   * The role the group member should get when accepting the invite.
   */
  role: AppRole;
}

/**
 * Represents a group within an organization.
 */
export interface Group {
  /**
   * The ID of the group.
   */
  id: number;

  /**
   * The display name of the group.
   */
  name: string;

  /**
   * Custom annotations for the group.
   */
  annotations?: Record<string, string>;
}

/**
 * Group member in a group.
 */
export interface GroupMember {
  id: string;
  role: string;
  name: string;
  email: string;
}

export interface AppMemberGroup {
  /**
   * The ID of the group.
   */
  id: number;

  /**
   * The display name of the group.
   */
  name: string;

  /**
   * The role of the app member inside the group.
   */
  role: AppRole;
}

/**
 * The layout used to store Appsemble messages.
 */
export interface AppsembleMessages {
  /**
   * Messages related to the Appsemble core.
   *
   * This may be an empty object if the language is the default locale.
   */
  core: Record<string, string>;

  /**
   * Translations for global block messages and meta properties of the app.
   *
   * This may be an empty object if the language is the default locale.
   */
  app: Record<string, string>;

  /**
   * A list of messages specific to the app.
   */
  messageIds: Record<string, string>;

  /**
   * A list of messages specific to each block used in the app.
   *
   * At root the keys represent a block type.
   * One layer deep the keys represent a block version.
   * Two layers deep the keys represent the key/message pairs.
   *
   * @example
   * {
   *   "<at>example/test": {
   *     "0.0.0": {
   *       "exampleKey": "Example Message"
   *     }
   *   }
   * }
   */
  blocks: Record<string, Record<string, Record<string, string>>>;
}

// XXX: The interfaces for messages below kinda suck
/**
 * Translated messages for an app or block.
 */
export interface Messages {
  /**
   * If true, force update app messages.
   */
  force?: boolean;

  /**
   * The language represented by these messages.
   */
  language: string;

  /**
   * A mapping of message id to message content.
   */
  messages?: AppsembleMessages;
}

export interface AppMessages {
  /**
   * The language represented by these messages.
   */
  language: string;

  /**
   * The messages available to the app
   */
  messages: AppsembleMessages;
}

/**
 * A representation of an OAuth2 provider in Appsemble.
 *
 * This interface holds the properties needed to render a redirect button on the login or profile
 * screen.
 */
export interface OAuth2Provider {
  type?: 'oauth2';

  /**
   * The OAuth2 redirect URL.
   *
   * The user will be redirected here. On this page the user will have to grant access to Appsemble
   * to log them in.
   */
  authorizationUrl: string;

  /**
   * The public client id which identifies Appsemble to the authorization server.
   */
  clientId: string;

  /**
   * A Font Awesome icon which represents the OAuth2 provider.
   */
  icon: IconName;

  /**
   * A display name which represents the OAuth2 provider.
   *
   * I.e. `Facebook`, `GitLab`, or `Google`.
   */
  name: string;

  /**
   * The login scope that will be requested from the authorization server.
   *
   * This is represented as a space separated list of scopes.
   */
  scope: string;
}

export type ValueFromDefinition = boolean | number | string | null | undefined;

export type ValueFromProcess = boolean | number | string | undefined;

export interface AppConfigEntryDefinition {
  name: string;
  value: ValueFromDefinition;
}

export interface AppConfigEntry extends AppConfigEntryDefinition {
  /**
   * An autogenerated ID.
   */
  id: number;

  /**
   * The parsed value of the config entry.
   */
  value: ValueFromProcess;
}

export type ServiceAuthenticationMethod =
  | 'client-certificate'
  | 'client-credentials'
  | 'cookie'
  | 'custom-header'
  | 'http-basic'
  | 'query-parameter';

export interface AppServiceSecretDefinition {
  /**
   * An optional name to give extra clarity what the secret is used for.
   */
  name?: string;

  /**
   * The url pattern that is matched when a proxied request action is called.
   */
  urlPatterns: string;

  /**
   * The method to authenticate the request action with.
   */
  authenticationMethod: ServiceAuthenticationMethod;

  /**
   * The parameter name, header name, username or certificate that goes with the secret.
   */
  identifier?: string;

  /**
   * The secret to authenticate the proxied outgoing request with.
   */
  secret?: string;

  /**
   * The tokenUrl used for client-credentials method.
   */
  tokenUrl?: string;

  /**
   * The scope used for client-credentials method.
   */
  scope?: string;

  /**
   * The custom certificate authority used for client-certificate method.
   */
  ca?: string;

  /**
   * If a secret is marked public, it can be applied to the unauthenticated users, e.g. in the
   * requests originating in a custom sign up or login page.
   *
   * @default false
   */
  public: boolean;
}

export interface AppServiceSecret extends AppServiceSecretDefinition {
  /**
   * An autogenerated ID.
   */
  id: number;
}

export interface AppWebhookSecretDefinition {
  /**
   * The name of the webhook this secret is tied to.
   */
  webhookName: string;

  /**
   * An optional name to give extra clarity what the secret is used for.
   */
  name?: string;
}

export interface AppWebhookSecret extends AppWebhookSecretDefinition {
  /**
   * An autogenerated ID.
   */
  id: string;
}

export interface AppOAuth2Secret extends OAuth2Provider {
  /**
   * An autogenerated ID.
   */
  id?: number;

  /**
   * The OAuth2 client secret used to identify Appsemble as a client to the authorization server.
   */
  clientSecret: string;

  /**
   * The URL where tokens may be requested using the authorization code flow.
   */
  tokenUrl: string;

  /**
   * The URL from where to fetch user info.
   */
  userInfoUrl?: string;

  /**
   * The remapper to apply on the user info data.
   */
  remapper: Remapper;
}

export interface WritableAppSamlSecret {
  /**
   * The name that will be displayed on the login button.
   */
  name: string;

  /**
   * The icon that will be displayed on the login button.
   */
  icon: IconName;

  /**
   * The certificate of the identity provider.
   */
  idpCertificate: string;

  /**
   * The URL of the identity provider where SAML metadata is hosted.
   */
  entityId: string;

  /**
   * The URL of the identity provider where the user will be redirected to in order to login.
   */
  ssoUrl: string;

  /**
   * The custom SAML attribute that’s used to specify the user display name.
   */
  nameAttribute: string;

  /**
   * The custom SAML attribute that’s used to specify the user email address.
   */
  emailAttribute: string;
}

export interface AppSamlSecret extends WritableAppSamlSecret {
  /**
   * The unique ID of the secret.
   */
  id?: number;

  /**
   * When the secret was last updated.
   */
  updated?: string;

  /**
   * The SAML service provider certificate.
   */
  spCertificate?: string;
}

export type SAMLStatus =
  | 'badsignature'
  | 'emailconflict'
  | 'invalidrelaystate'
  | 'invalidsecret'
  | 'invalidstatuscode'
  | 'invalidsubjectconfirmation'
  | 'missingnameid'
  | 'missingsubject';

export interface ProjectBuildConfig extends ProjectConfig {
  /**
   * The build output directory relative to the project directory.
   */
  output?: string;

  /**
   * The absolute directory of the project.
   */
  dir: string;

  [key: string]: any;
}

export interface LogObject {
  fromAppsemble: boolean;
  entries: string[];
}
