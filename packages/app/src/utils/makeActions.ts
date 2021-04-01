import { Action } from '@appsemble/sdk';
import {
  ActionDefinition,
  ActionType,
  BlockDefinition,
  FlowPageDefinition,
} from '@appsemble/types';
import { has } from '@appsemble/utils';
import { addBreadcrumb, Severity } from '@sentry/browser';
import { SetRequired } from 'type-fest';

import { MakeActionParameters } from '../types';
import { ActionCreators, actionCreators } from './actions';

interface CommonActionParams {
  extraCreators: ActionCreators;
  pageReady: Promise<void>;
}

type MakeActionsParams = CommonActionParams &
  Omit<MakeActionParameters<ActionDefinition>, 'definition'> & {
    actions: Record<string, ActionType>;
    context: BlockDefinition | FlowPageDefinition;
  };

type CreateActionParams<T extends ActionDefinition['type']> = CommonActionParams &
  MakeActionParameters<Extract<ActionDefinition, { type: T }>>;

/**
 * Create a callable action for an action definition and context.
 *
 * @param params - The context to create an action for.
 * @returns An action as it is injected into a block by the SDK.
 */
function createAction<T extends ActionDefinition['type']>({
  definition,
  extraCreators,
  pageReady,
  prefix,
  remap,
  ...params
}: CreateActionParams<T>): Action {
  const type = (definition?.type ?? 'noop') as T;
  const actionCreator = has(actionCreators, type)
    ? actionCreators[type]
    : has(extraCreators, type)
    ? actionCreators[type]
    : actionCreators.noop;

  // @ts-expect-error ts(2590) Expression produces a union type that is too complex to represent.
  const [dispatch, properties] = actionCreator({
    ...params,
    definition,
    remap,
    prefix,
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
      remap,
    });
  const onError =
    definition?.onError &&
    createAction({
      ...params,
      definition: definition.onError,
      extraCreators,
      pageReady,
      prefix: `${prefix}.onError`,
      remap,
    });

  const action = ((async (args?: any, context?: Record<string, any>) => {
    await pageReady;
    let result;

    try {
      result = await dispatch(
        Object.hasOwnProperty.call(definition, 'remap')
          ? remap(definition.remap, args, context)
          : args,
        context,
      );
      addBreadcrumb({
        category: 'appsemble.action',
        data: { success: type },
      });
    } catch (error: unknown) {
      addBreadcrumb({
        category: 'appsemble.action',
        data: { failed: type },
        level: Severity.Warning,
      });
      if (onError) {
        return onError(error, context);
      }

      throw error;
    }

    if (onSuccess) {
      return onSuccess(result, context);
    }

    return result;
  }) as Omit<Action, string>) as Action;
  // Name the function to enhance stack traces.
  Object.defineProperty(action, 'name', { value: `${type}[wrapper]` });
  action.type = type;
  // @ts-expect-error for backwards compatibility with blocks using @appsemble/sdk < 0.18.6
  action.dispatch = action;

  return Object.assign(action, properties);
}

export function makeActions({
  actions,
  context,
  prefix,
  ...params
}: MakeActionsParams): Record<string, Action> {
  const actionMap = Object.entries(actions || {})
    .filter(([key]) => key !== '$any')
    .reduce<Record<string, Action>>((acc, [on, { required }]) => {
      let definition: ActionDefinition;
      if (!context.actions || !Object.hasOwnProperty.call(context.actions, on)) {
        if (required) {
          throw new Error(`Missing required action ${on}`);
        }
      } else {
        definition = context.actions[on as keyof typeof context.actions];
      }

      const action = createAction({
        ...params,
        definition,
        prefix: `${prefix}.actions.${on}`,
      });

      acc[on] = action;
      return acc;
    }, {});

  let anyActions: Record<string, Action>;
  if (actions?.$any) {
    anyActions = Object.keys(context.actions || {})
      .filter((key) => !actionMap[key])
      .reduce<Record<string, Action>>((acc, on: keyof typeof context.actions) => {
        const definition = context.actions[on];

        const action = createAction({
          ...params,
          definition,
          prefix: `${prefix}.actions.${on}`,
        });

        acc[on] = action;
        return acc;
      }, {});
  }

  return { ...anyActions, ...actionMap };
}

export function createTestAction<T extends ActionDefinition['type']>(
  params: SetRequired<Partial<CreateActionParams<T>>, 'definition'>,
): Action {
  return createAction<T>({
    app: null,
    definition: null,
    ee: null,
    extraCreators: null,
    flowActions: null,
    history: null,
    pageReady: Promise.resolve(),
    prefix: null,
    pushNotifications: null,
    remap: null,
    route: null,
    showDialog: null,
    showMessage: null,
    teams: [],
    updateTeam: null,
    userInfo: null,
    ...params,
  });
}
