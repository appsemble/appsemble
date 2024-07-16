import { formatServiceName, getLogs } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App } from '../models/App.js';

export async function getContainerLogs(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, container },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['path'] });

  const serviceName = formatServiceName(container, app.path, String(appId));

  const logsAppsemble = await getLogs(serviceName, true);
  const logsContainer = await getLogs(serviceName);

  const logs = [...logsAppsemble, ...logsContainer];

  ctx.body = logs;
}
