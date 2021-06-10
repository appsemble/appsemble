import { logger } from '@appsemble/node-utils';
import { remap } from '@appsemble/utils';

import { actions, ServerActionParameters } from './actions';

export async function handleAction(
  action: (params: ServerActionParameters) => Promise<unknown>,
  params: ServerActionParameters,
): Promise<void> {
  logger.info(`Running action: ${params.action.type}`);
  let data =
    'remap' in params.action
      ? remap(params.action.remap, params.data, {
          appId: params.app.id,
          context: {},
          // XXX: Implement getMessage and default language selections
          getMessage() {
            return null;
          },
          userInfo: undefined,
        })
      : params.data;

  try {
    data = await action({ ...params, data });
    if (params.action.onSuccess) {
      await handleAction(actions[params.action.onSuccess.type], {
        ...params,
        action: params.action.onSuccess,
        data,
      });
    }
  } catch (error: unknown) {
    logger.error(`Error running action: ${params.action.type}`);
    if (params.action.onError) {
      return handleAction(actions[params.action.onError.type], {
        ...params,
        action: params.action.onError,
        data,
      });
    }
    throw error;
  }
  logger.info(`Succesfully ran action: ${params.action.type}`);
}
