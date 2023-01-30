import { logger } from '@appsemble/node-utils';
import { LogActionDefinition } from '@appsemble/types';

import { ServerActionParameters } from './index.js';

export function log({ action, data }: ServerActionParameters<LogActionDefinition>): any {
  if (process.env.NODE_ENV !== 'production') {
    switch (action.level) {
      case 'error':
        logger.error(data);
        break;
      case 'warn':
        logger.warn(data);
        break;
      default:
        logger.info(data);
    }
  }
  return data;
}
