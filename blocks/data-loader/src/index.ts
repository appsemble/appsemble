import { bootstrap } from '@appsemble/sdk';

import { Actions, EventEmitters, EventListeners } from '../block';

bootstrap<null, Actions, EventEmitters, EventListeners>(({ actions, data, events, utils }) => {
  async function loadData(): Promise<void> {
    try {
      const result = await actions.onLoad.dispatch(data);
      events.emit.data(result);
    } catch (err) {
      utils.showMessage('Failed to load data');
    }
  }

  events.on.refresh(loadData);
  loadData();
});
