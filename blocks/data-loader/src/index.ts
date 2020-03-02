import { bootstrap } from '@appsemble/sdk';

import { Actions, Events, Parameters } from '../block';

bootstrap<Parameters, Actions, Events>(({ actions, block, events, pageParameters, utils }) => {
  async function loadData(d?: any): Promise<void> {
    try {
      const result = await actions.onLoad.dispatch({ ...pageParameters, ...d });
      events.emit.data(result);
    } catch (err) {
      events.emit.data(null, 'Failed to load data');
      utils.showMessage('Failed to load data');
    }
  }

  events.on.refresh(loadData);

  if (block.parameters?.skipInitialLoad) {
    return;
  }

  loadData();
});
