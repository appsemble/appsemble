import { type Action, type ActionDefinition, type ActionType } from '@appsemble/types';
import { defaultLocale, has, remap } from '@appsemble/utils';
import { addBreadcrumb } from '@sentry/browser';
import { IntlMessageFormat } from 'intl-messageformat';
import { type SetRequired } from 'type-fest';

import { actionCreators } from './actions/index.js';
import { appId } from './settings.js';
import { type MakeActionParameters } from '../types.js';

/**
 * Parameters to pass to `makeActions`.
 *
 * @see makeActions
 */
export type MakeActionsParams = Omit<MakeActionParameters<ActionDefinition>, 'definition'> & {
  actions: Record<string, ActionType>;
  context: { actions?: Record<string, ActionDefinition> };
};

type CreateActionParams<T extends ActionDefinition['type']> = MakeActionParameters<
  Extract<ActionDefinition, { type: T }>
>;

/**
 * Create a callable action for an action definition and context.
 *
 * @param params The context to create an action for.
 * @returns An action as it is injected into a block by the SDK.
 */
export function createAction<T extends ActionDefinition['type']>({
  definition,
  extraCreators,
  pageReady,
  prefix,
  prefixIndex,
  remap: localRemap,
  ...params
}: CreateActionParams<T>): Extract<Action, { type: T }> {
  const type = (definition?.type ?? 'noop') as T;
  const actionCreator = has(actionCreators, type)
    ? actionCreators[type]
    : has(extraCreators, type)
      ? extraCreators[type]
      : actionCreators.noop;

  const [dispatch, properties] = actionCreator({
    ...params,
    // @ts-expect-error TS2345
    definition,
    extraCreators,
    remap: localRemap,
    prefix,
    prefixIndex,
  });
  // Name the function to enhance stack traces.
  Object.defineProperty(dispatch, 'name', { value: `${type}[implementation]` });

  const onSuccess =
    definition?.onSuccess &&
    createAction({
      ...params,
      definition: definition.onSuccess,
      extraCreators,
      pageReady,
      prefix: `${prefix}.onSuccess`,
      prefixIndex: `${prefixIndex}.onSuccess`,
      remap: localRemap,
    });
  const onError =
    definition?.onError &&
    createAction({
      ...params,
      definition: definition.onError,
      extraCreators,
      pageReady,
      prefix: `${prefix}.onError`,
      prefixIndex: `${prefixIndex}.onError`,
      remap: localRemap,
    });

  const action = (async (args?: any, context?: Record<string, any>) => {
    await pageReady;
    let result;
    let updatedContext;

    try {
      const data = has(definition, 'remapBefore')
        ? localRemap(definition.remapBefore, args, context)
        : has(definition, 'remap')
          ? localRemap(definition.remap, args, context)
          : args;

      updatedContext = {
        ...context,
        history: [...(context?.history ?? []), data],
      };

      result = await dispatch(data, updatedContext);

      if (has(definition, 'remapAfter')) {
        result = localRemap(definition.remapAfter, result, updatedContext);
      }
      addBreadcrumb({
        category: 'appsemble.action',
        data: { success: type },
      });
    } catch (error: unknown) {
      addBreadcrumb({
        category: 'appsemble.action',
        data: { failed: type },
        level: 'warning',
      });
      if (onError) {
        return onError(error, updatedContext);
      }

      throw error;
    }

    if (onSuccess) {
      return onSuccess(result, updatedContext);
    }

    return result;
  }) as Omit<Action, string> as Extract<Action, { type: T }>;
  // Name the function to enhance stack traces.
  Object.defineProperty(action, 'name', { value: `${type}[wrapper]` });
  action.type = type;
  // @ts-expect-error for backwards compatibility with blocks using @appsemble/sdk < 0.18.6
  action.dispatch = action;

  return Object.assign(action, properties);
}

/**
 * Create action implementations from a mapping of action definitions.
 *
 * Typically the return value is passed to a block built using `@appsemble/sdk`.
 *
 * @param params Parameters which define how to implement the actions.
 * @returns A mapping of action definitions.
 */
export function makeActions({
  actions,
  context,
  prefix,
  prefixIndex,
  ...params
}: MakeActionsParams): Record<string, Action> {
  const actionMap: Record<string, Action> = {};
  const keys = actions ? Object.keys(actions) : [];
  if (keys.includes('$any') && context?.actions) {
    keys.push(...Object.keys(context.actions));
  }

  for (const key of new Set(keys)) {
    if (key !== '$any') {
      actionMap[key] = createAction({
        ...params,
        definition: context?.actions?.[key],
        prefix: `${prefix}.actions.${key}`,
        prefixIndex: `${prefixIndex}.actions.${key}`,
      });
    }
  }

  return actionMap;
}

export function createTestAction<T extends ActionDefinition['type']>(
  params: SetRequired<Partial<CreateActionParams<T>>, 'definition'>,
): Extract<Action, { type: T }> {
  return createAction<T>({
    app: null,
    definition: null,
    ee: null,
    extraCreators: null,
    flowActions: null,
    getAppMessage: ({ defaultMessage }) => new IntlMessageFormat(defaultMessage),
    navigate: null,
    pageReady: Promise.resolve(),
    appStorage: null,
    prefix: null,
    prefixIndex: null,
    pushNotifications: null,
    remap: (remapper, data, context) =>
      remap(remapper, data, {
        getMessage: ({ defaultMessage }) => new IntlMessageFormat(defaultMessage),
        appId,
        url: 'https://example.com/en/example',
        appUrl: 'https://example.com',
        userInfo: null,
        context,
        locale: defaultLocale,
        appMember: undefined,
      }),
    params: {
      lang: 'en',
    },
    showDialog: null,
    showShareDialog: null,
    showMessage: null,
    teams: [],
    updateTeam: null,
    getUserInfo: null,
    passwordLogin: null,
    passwordLogout: null,
    setUserInfo: null,
    refetchDemoAppMembers: null,
    ...params,
  });
}
