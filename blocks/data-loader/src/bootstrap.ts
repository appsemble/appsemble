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
  // Monotonically increasing id of the most recently started load. Rapid refreshes can make
  // loads resolve out of order; only the latest one may emit, or a stale response would
  // overwrite newer data.
  let latestLoad = 0;

  async function loadData(d?: Record<string, unknown>): Promise<void> {
    latestLoad += 1;
    const currentLoad = latestLoad;
    try {
      const result = await actions.onLoad({ ...pageParameters, ...d }, { data });
      if (currentLoad !== latestLoad) {
        return;
      }
      events.emit.data(result);
    } catch (error) {
      if (currentLoad !== latestLoad) {
        return;
      }
      // The block was unmounted mid-load, e.g. by switching tabs. The load did not fail; it was
      // cancelled, so there is nothing to report.
      if (utils.isActionOwnerAbortError(error)) {
        return;
      }
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
