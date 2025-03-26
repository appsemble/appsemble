import { type Action, type ActionDefinition, ActionError, type ActionType } from '@appsemble/types';
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
    ? actionCreators[type]!
    : has(extraCreators, type)
      ? extraCreators![type]!
      : actionCreators.noop!;

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
      try {
        const data = has(definition, 'remapBefore')
          ? localRemap(definition.remapBefore ?? null, args, context)
          : has(definition, 'remap')
            ? localRemap(definition.remap ?? null, args, context)
            : args;

        updatedContext = {
          ...context,
          history: [...(context?.history ?? []), data],
        };

        result = await dispatch(data, updatedContext);

        if (has(definition, 'remapAfter')) {
          result = localRemap(definition.remapAfter ?? null, result, updatedContext);
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
          return await onError(error, updatedContext);
        }
        throw error;
      }

      if (onSuccess) {
        return await onSuccess(result, updatedContext);
      }
      return result;
    } catch (error) {
      throw new ActionError({ cause: error, data: args, definition });
    }
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
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
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
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    appDefinition: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    definition: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    ee: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    extraCreators: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    flowActions: null,
    getAppMessage: ({ defaultMessage }) => new IntlMessageFormat(defaultMessage ?? ''),
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    navigate: null,
    pageReady: Promise.resolve(),
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    appStorage: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    prefix: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    prefixIndex: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    pushNotifications: null,
    remap: (remapper, data, context) =>
      remap(remapper, data, {
        getMessage: ({ defaultMessage }) => new IntlMessageFormat(defaultMessage ?? ''),
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        getVariable: params.getAppVariable,
        appId,
        url: 'https://example.com/en/example',
        appUrl: 'https://example.com',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        appMemberInfo: null,
        context: context ?? {},
        locale: defaultLocale,
      }),
    params: {
      lang: 'en',
    },
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    showDialog: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    showShareDialog: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    showMessage: null,
    appMemberGroups: [],
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    addAppMemberGroup: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    getAppMemberInfo: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    passwordLogin: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    passwordLogout: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    setAppMemberInfo: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    refetchDemoAppMembers: null,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    getAppMemberSelectedGroup: null,
    ...params,
  });
}
