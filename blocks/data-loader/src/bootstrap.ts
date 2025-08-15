import { type BootstrapParams } from '@appsemble/sdk';

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
    } catch {
      events.emit.data(null, 'Failed to load data');
      utils.showMessage(utils.formatMessage('loadErrorMessage'));
    }
  }

  events.on.refresh?.(loadData);

  if (skipInitialLoad) {
    return;
  }

  loadData();
}
