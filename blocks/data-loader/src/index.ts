import { bootstrap } from '@appsemble/sdk';

bootstrap(({ actions, events, pageParameters, parameters, utils }) => {
  async function loadData(d?: { [key: string]: unknown }): Promise<void> {
    try {
      const result = await actions.onLoad.dispatch({ ...pageParameters, ...d });
      events.emit.data(result);
    } catch {
      events.emit.data(null, 'Failed to load data');
      utils.showMessage('Failed to load data');
    }
  }

  events.on.refresh(loadData);

  if (parameters.skipInitialLoad) {
    return;
  }

  loadData();
});
