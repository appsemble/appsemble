import { type OpenAPIV3 } from 'openapi-types';

import { type BlockDefinition } from './block.js';
import { type BulmaColor } from './bulma.js';
import { type HTTPMethods } from './http.js';
import { type Remapper } from './remapper.js';

export type ActionDefinition =
  | AnalyticsAction
  | AppMemberCurrentPatchAction
  | AppMemberDeleteAction
  | AppMemberInviteAction
  | AppMemberLoginAction
  | AppMemberLogoutAction
  | AppMemberPropertiesPatchAction
  | AppMemberQueryAction
  | AppMemberRegisterAction
  | AppMemberRoleUpdateAction
  | BaseActionDefinition<'dialog.error'>
  | BaseActionDefinition<'dialog.ok'>
  | BaseActionDefinition<'flow.back'>
  | BaseActionDefinition<'flow.cancel'>
  | BaseActionDefinition<'flow.finish'>
  | BaseActionDefinition<'flow.next'>
  | BaseActionDefinition<'group.query'>
  | BaseActionDefinition<'link.back'>
  | BaseActionDefinition<'link.next'>
  | BaseActionDefinition<'noop'>
  | BaseActionDefinition<'throw'>
  | ConditionActionDefinition
  | ControllerActionDefinition
  | CsvParserActionDefinition
  | DialogActionDefinition
  | DownloadActionDefinition
  | EachActionDefinition
  | EmailActionDefinition
  | EventActionDefinition
  | FlowToActionDefinition
  | GroupMemberDeleteActionDefinition
  | GroupMemberInviteActionDefinition
  | GroupMemberQueryActionDefinition
  | GroupMemberRoleUpdateActionDefinition
  | LinkActionDefinition
  | LogActionDefinition
  | MatchActionDefinition
  | MessageActionDefinition
  | NotifyActionDefinition
  | RequestActionDefinition
  | ResourceCountActionDefinition
  | ResourceCreateActionDefinition
  | ResourceDeleteActionDefinition
  | ResourceDeleteAllActionDefinition
  | ResourceDeleteBulkActionDefinition
  | ResourceGetActionDefinition
  | ResourceHistoryGetActionDefinition
  | ResourcePatchActionDefinition
  | ResourceQueryActionDefinition
  | ResourceSubscriptionStatusActionDefinition
  | ResourceSubscriptionSubscribeActionDefinition
  | ResourceSubscriptionToggleActionDefinition
  | ResourceSubscriptionUnsubscribeActionDefinition
  | ResourceUpdateActionDefinition
  | ResourceUpdatePositionsActionDefinition
  | ShareActionDefinition
  | StaticActionDefinition
  | StorageAppendActionDefinition
  | StorageDeleteActionDefinition
  | StorageReadActionDefinition
  | StorageSubtractActionDefinition
  | StorageUpdateActionDefinition
  | StorageWriteActionDefinition;

export type ActionName =
  | 'analytics'
  | 'app.member.current.patch'
  | 'app.member.delete'
  | 'app.member.invite'
  | 'app.member.login'
  | 'app.member.logout'
  | 'app.member.properties.patch'
  | 'app.member.query'
  | 'app.member.register'
  | 'app.member.role.update'
  | 'condition'
  | 'controller'
  | 'csv.parse'
  | 'dialog.error'
  | 'dialog.ok'
  | 'dialog'
  | 'download'
  | 'each'
  | 'email'
  | 'event'
  | 'flow.back'
  | 'flow.cancel'
  | 'flow.finish'
  | 'flow.next'
  | 'flow.to'
  | 'group.member.delete'
  | 'group.member.invite'
  | 'group.member.query'
  | 'group.member.role.update'
  | 'group.query'
  | 'link.back'
  | 'link.next'
  | 'link'
  | 'log'
  | 'match'
  | 'message'
  | 'noop'
  | 'notify'
  | 'request'
  | 'resource.count'
  | 'resource.create'
  | 'resource.delete.all'
  | 'resource.delete.bulk'
  | 'resource.delete'
  | 'resource.get'
  | 'resource.history.get'
  | 'resource.patch'
  | 'resource.query'
  | 'resource.subscription.status'
  | 'resource.subscription.subscribe'
  | 'resource.subscription.toggle'
  | 'resource.subscription.unsubscribe'
  | 'resource.update.positions'
  | 'resource.update'
  | 'share'
  | 'static'
  | 'storage.append'
  | 'storage.delete'
  | 'storage.read'
  | 'storage.subtract'
  | 'storage.update'
  | 'storage.write'
  | 'throw';

export interface BaseActionDefinition<T extends ActionName> {
  /**
   * The type of the action.
   */
  type: T;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   *
   * @deprecated Since 0.20.10, use {@link remapBefore} instead.
   */
  remap?: Remapper;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   */
  remapBefore?: Remapper;

  /**
   * The remapper used to transform the output before passing it to the next action.
   */
  remapAfter?: Remapper;

  /**
   * Another action that is dispatched when the action has been dispatched successfully.
   */
  onSuccess?: ActionDefinition;

  /**
   * Another action that is dispatched when the action has failed to dispatch successfully.
   */
  onError?: ActionDefinition;
}

export interface AnalyticsAction extends BaseActionDefinition<'analytics'> {
  /**
   * The analytics event target name.
   */
  target: string;

  /**
   * Additional config to pass to analytics.
   */
  config?: Remapper;
}

export interface ConditionActionDefinition extends BaseActionDefinition<'condition'> {
  /**
   * The condition to check for.
   */
  if: Remapper;

  /**
   * The action to run if the condition is true.
   */
  then: ActionDefinition;

  /**
   * The action to run if the condition is false.
   */
  else: ActionDefinition;
}

export interface MatchActionDefinition extends BaseActionDefinition<'match'> {
  /**
   * Run another action if one of the cases is true.
   *
   * Only the first case that equals true is called.
   */
  match: {
    /**
     * The case to be matched.
     */
    case: Remapper;

    /**
     * Action to be called if the case equals true.
     */
    action: ActionDefinition;
  }[];
}

export interface DialogActionDefinition extends BaseActionDefinition<'dialog'> {
  /**
   * If false, the dialog cannot be closed by clicking outside of the dialog or on the close button.
   */
  closable?: boolean;

  /**
   * If true, the dialog will be displayed full screen.
   */
  fullscreen?: boolean;

  /**
   * Blocks to render on the dialog.
   */
  blocks: BlockDefinition[];

  /**
   * The title to show in the dialog.
   */
  title?: Remapper;
}

export interface DownloadActionDefinition extends BaseActionDefinition<'download'> {
  /**
   * The filename to download the file as. It must include a file extension.
   */
  filename: string;
}

export interface EachActionDefinition extends BaseActionDefinition<'each'> {
  /**
   * Run the actions in series instead of parallel.
   */
  serial?: boolean;

  /**
   * Run an action for each entry in an array.
   *
   * The actions are run in parallel.
   *
   * If the input is not an array, the action will be applied to the input instead.
   */
  do: ActionDefinition;
}

export interface EmailActionDefinition extends BaseActionDefinition<'email'> {
  /**
   * The recipient of the email.
   */
  to?: Remapper;

  /**
   * The name of the sender.
   *
   * The default value depends on the email server.
   */
  from?: Remapper;

  /**
   * The recipients to CC the email to.
   */
  cc?: Remapper;

  /**
   * The recipients to BCC the email to.
   */
  bcc?: Remapper;

  /**
   * The subject of the email.
   */
  subject: Remapper;

  /**
   * The body of the email.
   */
  body: Remapper;

  /**
   * The attachments to include in the email.
   *
   * The remapper must resolve to an object containing the following properties:
   *
   * - \`target\`: The asset ID or link to download contents from to add as an attachment. This is
   * mutually exclusive with \`content\`.
   * - \`content\`: The raw content to include as the file content. This is mutually exclusive with
   * \`target\`.
   * - \`filename\`: The filename to include the attachment as.
   * - \`accept\` If the target is a URL, this will be set as the HTTP \`Accept\` header when
   * downloading the file.
   *
   * If the attachment is a string, it will be treated as the target.
   */
  attachments?: Remapper;
}

export interface FlowToActionDefinition extends BaseActionDefinition<'flow.to'> {
  /**
   * The flow step to go to.
   */
  step: Remapper;
}

export interface LinkActionDefinition extends BaseActionDefinition<'link'> {
  /**
   * Where to link to.
   *
   * This should be a page name.
   */
  to: Remapper | string[] | string;
}

export interface NotifyActionDefinition extends BaseActionDefinition<'notify'> {
  /**
   * The title of the notification.
   */
  title: Remapper;

  /**
   * The description of the notification.
   */
  body: Remapper;

  /**
   * To whom the notification should be sent.
   *
   * Use `all` to send the notification to all app subscribed users.
   * Or notify specific users by passing either a single user id or an array of user ids.
   *
   * Nothing is sent if the value is **not** a valid user id.
   */
  to: Remapper;
}

export interface LogActionDefinition extends BaseActionDefinition<'log'> {
  /**
   * The logging level on which to log.
   *
   * @default `info`.
   */
  // TODO: remove comment
  // level?: LogAction['level'];
  level?: 'error' | 'info' | 'warn';
}

export interface ShareActionDefinition extends BaseActionDefinition<'share'> {
  /**
   * The URL that is being shared.
   */
  url?: Remapper;

  /**
   * The main body that is being shared.
   */
  text?: Remapper;

  /**
   * The title that is being shared, if supported.
   */
  title?: Remapper;
}

export type StorageType = 'appStorage' | 'indexedDB' | 'localStorage' | 'sessionStorage';

export interface StorageAppendActionDefinition extends BaseActionDefinition<'storage.append'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The data to write to the app’s storage.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageDeleteActionDefinition extends BaseActionDefinition<'storage.delete'> {
  /**
   * The key of the entry to delete from the app’s storage.
   */
  key: Remapper;

  /**
   * The mechanism used to delete the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageSubtractActionDefinition extends BaseActionDefinition<'storage.subtract'> {
  /**
   * The key of the entry to subtract the last entry from
   */
  key: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageUpdateActionDefinition extends BaseActionDefinition<'storage.update'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The key of the item to update.
   */
  item: Remapper;

  /**
   * The data to update the specified item with.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageReadActionDefinition extends BaseActionDefinition<'storage.read'> {
  /**
   * The key of the entry to read from the app’s storage.
   */
  key: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageWriteActionDefinition extends BaseActionDefinition<'storage.write'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The data to write to the app’s storage.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;

  /**
   * Expiry of the data stored, to be used with `localStorage`.
   */
  expiry?: '1d' | '3d' | '7d' | '12h';
}

export interface GroupMemberInviteActionDefinition
  extends BaseActionDefinition<'group.member.invite'> {
  /**
   * The ID of the group to invite the user to.
   */
  id: Remapper;

  /**
   * The email address of the user to invite.
   */
  email: Remapper;

  /**
   * The role of the invited group member.
   */
  role: Remapper;
}

export interface GroupMemberQueryActionDefinition
  extends BaseActionDefinition<'group.member.query'> {
  /**
   * The ID of the group to query the members of.
   */
  id: Remapper;
}

export interface GroupMemberDeleteActionDefinition
  extends BaseActionDefinition<'group.member.delete'> {
  /**
   * The ID of the group member to delete.
   */
  id: Remapper;
}

export interface GroupMemberRoleUpdateActionDefinition
  extends BaseActionDefinition<'group.member.role.update'> {
  /**
   * The ID of the group member to update the role of.
   */
  id: Remapper;

  /**
   * The role to invite the app member with.
   */
  role: Remapper;
}

export interface AppMemberLoginAction extends BaseActionDefinition<'app.member.login'> {
  /**
   * The email address to log in with.
   */
  email: Remapper;

  /**
   * The password to log in with.
   */
  password: Remapper;
}

export interface AppMemberRegisterAction extends BaseActionDefinition<'app.member.register'> {
  /**
   * The email address to register with.
   */
  email: Remapper;

  /**
   * The password to login with.
   */
  password: Remapper;

  /**
   * The full name of the app member.
   */
  name: Remapper;

  /**
   * The profile picture to use.
   *
   * This must be a file, otherwise it’s discarded.
   */
  picture?: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties?: Remapper;

  /**
   * Whether to login after registering.
   *
   * @default true
   */
  login?: boolean;
}

export interface AppMemberInviteAction extends BaseActionDefinition<'app.member.invite'> {
  /**
   * The email address to invite the app member with.
   */
  email: Remapper;

  /**
   * The role to invite the app member with.
   */
  role: Remapper;
}

export interface AppMemberQueryAction extends BaseActionDefinition<'app.member.query'> {
  /**
   * The roles of the users to fetch.
   */
  roles?: Remapper;

  /**
   * Additional filters to fetch members based on properties and other fields.
   *
   */
  query?: Remapper;
}

export interface AppMemberRoleUpdateAction extends BaseActionDefinition<'app.member.role.update'> {
  /**
   * The id of the app member to update.
   */
  sub: Remapper;

  /**
   * The role of the updated app member
   */
  role: Remapper;
}

export interface AppMemberPropertiesPatchAction
  extends BaseActionDefinition<'app.member.properties.patch'> {
  /**
   * The id of the app member to update.
   */
  sub: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties: Remapper;
}

export interface AppMemberCurrentPatchAction
  extends BaseActionDefinition<'app.member.current.patch'> {
  /**
   * The display name to update.
   */
  name?: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties?: Remapper;

  /**
   * The profile picture to use.
   *
   * This must be a file, otherwise it’s discarded.
   */
  picture?: Remapper;
}

export interface AppMemberDeleteAction extends BaseActionDefinition<'app.member.delete'> {
  /**
   * The id of the app member to remove.
   */
  sub: Remapper;
}

interface RequestActionHeaders {
  'Content-Type':
    | 'application/x-www-form-urlencoded'
    | 'application/xml'
    | 'multipart/form-data'
    | 'text/plain';
}

export interface RequestLikeActionDefinition<T extends ActionName = ActionName>
  extends BaseActionDefinition<T> {
  /**
   * The HTTP method to use for making a request.
   */
  method?: HTTPMethods;

  /**
   * Whether or not to proxy the request through the Appsemble proxy endpoint.
   *
   * @default true
   */
  proxy?: boolean;

  /**
   * A JSON schema against which to validate data before uploading.
   */
  schema?: OpenAPIV3.SchemaObject;

  /**
   * Query parameters to pass along with the request.
   */
  query?: Remapper;

  /**
   * The URL to which to make the request.
   */
  url?: Remapper;

  /**
   * A remapper for the request body.
   *
   * If this isn’t specified, the raw input data is used.
   */
  body?: Remapper;

  /**
   * Headers for the outgoing request.
   */
  headers?: RequestActionHeaders;
}

export interface ResourceActionDefinition<T extends ActionName>
  extends RequestLikeActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;
}

interface ViewResourceDefinition {
  /**
   * The view to use for the request.
   */
  view?: string;
}

interface OwnResourceDefinition {
  /**
   * If only the resources created by the authenticated app member should be included
   */
  own?: boolean;
}

interface ResourceActionWithIdDefinition {
  /**
   * Id of the resource to fetch
   */
  id?: Remapper;
}

export interface ControllerActionDefinition extends BaseActionDefinition<'controller'> {
  handler: string;
}

export type RequestActionDefinition = RequestLikeActionDefinition<'request'>;
export type ResourceCreateActionDefinition = ResourceActionDefinition<'resource.create'>;
export type ResourceDeleteActionDefinition = ResourceActionDefinition<'resource.delete'>;
export type ResourceDeleteAllActionDefinition = ResourceActionDefinition<'resource.delete.all'>;
export type ResourceDeleteBulkActionDefinition = ResourceActionDefinition<'resource.delete.bulk'>;
export type ResourceHistoryGetActionDefinition = ResourceActionDefinition<'resource.history.get'>;
export type ResourceGetActionDefinition = ResourceActionDefinition<'resource.get'> &
  ResourceActionWithIdDefinition &
  ViewResourceDefinition;
export type ResourceQueryActionDefinition = OwnResourceDefinition &
  ResourceActionDefinition<'resource.query'> &
  ViewResourceDefinition;
export type ResourceCountActionDefinition = OwnResourceDefinition &
  ResourceActionDefinition<'resource.count'>;
export type ResourceUpdateActionDefinition = ResourceActionDefinition<'resource.update'>;
export type ResourceUpdatePositionsActionDefinition =
  ResourceActionDefinition<'resource.update.positions'> & ResourceActionWithIdDefinition;
export type ResourcePatchActionDefinition = ResourceActionDefinition<'resource.patch'> &
  ResourceActionWithIdDefinition;
export type AppMemberLogoutAction = BaseActionDefinition<'app.member.logout'>;

export interface BaseResourceSubscribeActionDefinition<T extends ActionName>
  extends BaseActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;

  /**
   * The action to subscribe to. Defaults to `update` if not specified.
   */
  action?: 'create' | 'delete' | 'update';
}

export type ResourceSubscriptionSubscribeActionDefinition =
  BaseResourceSubscribeActionDefinition<'resource.subscription.subscribe'>;

export type ResourceSubscriptionUnsubscribeActionDefinition =
  BaseResourceSubscribeActionDefinition<'resource.subscription.unsubscribe'>;

export type ResourceSubscriptionToggleActionDefinition =
  BaseResourceSubscribeActionDefinition<'resource.subscription.toggle'>;

export type ResourceSubscriptionStatusActionDefinition = Omit<
  BaseResourceSubscribeActionDefinition<'resource.subscription.status'>,
  'action'
>;

export interface EventActionDefinition extends BaseActionDefinition<'event'> {
  /**
   * The name of the event to emit to.
   */
  event: string;

  /**
   * An event to wait for before resolving.
   *
   * If this is unspecified, the action will resolve with the input data.
   */
  waitFor?: string;
}

export interface StaticActionDefinition extends BaseActionDefinition<'static'> {
  /**
   * The value to return.
   */
  value: any;
}

export interface BaseMessage {
  /**
   * The color to use for the message.
   *
   * @default 'info'
   */
  color?: BulmaColor;

  /**
   * The timeout period for this message (in milliseconds).
   *
   * @default 5000
   */
  timeout?: number;

  /**
   * Whether or not to show the dismiss button.
   *
   * @default false
   */
  dismissable?: boolean;

  /**
   * The position of the message on the screen.
   *
   * @default 'bottom'
   */
  layout?: 'bottom' | 'top';
}

export type MessageActionDefinition = BaseActionDefinition<'message'> &
  BaseMessage & {
    /**
     * The content of the message to display.
     */
    body: Remapper;
  };

export interface CsvParserActionDefinition extends BaseActionDefinition<'csv.parse'> {
  /**
   * The value to return.
   */
  file: Remapper;

  /**
   * Delimiter
   */
  delimiter?: Remapper;
}
