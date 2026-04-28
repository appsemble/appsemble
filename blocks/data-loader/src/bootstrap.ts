import { type BootstrapParams } from '@appsemble/sdk';

import { getDataLoadError } from './utils.js';

export function DataLoader({
  actions,
  data,
  events,
  pageParameters,
  parameters: { skipInitialLoad = false },
  utils,
}: BootstrapParams): void {
  async function loadData(d?: Record<string, unknown>): Promise<void> {
    try {
      const result = await actions.onLoad({ ...pageParameters, ...d }, { data });
      events.emit.data(result);
    } catch (error) {
      events.emit.data(null, getDataLoadError(error));
      utils.showMessage(utils.formatMessage('loadErrorMessage'));
    }
  }

  events.on.refresh?.(loadData);

  if (skipInitialLoad) {
    return;
  }

  loadData();
}
