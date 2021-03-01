import { bootstrap } from '@appsemble/sdk';

bootstrap(({ actions, events, pageParameters, parameters: { skipInitialLoad = false }, utils }) => {
  async function loadData(d?: Record<string, unknown>): Promise<void> {
    try {
      const result = await actions.onLoad.dispatch({ ...pageParameters, ...d });
      events.emit.data(result);
    } catch {
      events.emit.data(null, 'Failed to load data');
      utils.showMessage(utils.formatMessage('loadErrorMessage'));
    }
  }

  events.on.refresh(loadData);

  if (skipInitialLoad) {
    return;
  }

  loadData();
});
