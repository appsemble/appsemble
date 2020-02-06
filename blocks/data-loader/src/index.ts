import { bootstrap } from '@appsemble/sdk';

import { Actions, Events } from '../block';

bootstrap<null, Actions, Events>(({ actions, data, events, pageParameters, utils }) => {
  async function loadData(d?: any): Promise<void> {
    try {
      const result = await actions.onLoad.dispatch({ ...pageParameters, ...data, ...d });
      events.emit.data(result);
    } catch (err) {
      events.emit.data(null, 'Failed to load data');
      utils.showMessage('Failed to load data');
    }
  }

  events.on.refresh(loadData);
  loadData();
});
