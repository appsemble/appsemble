import { bootstrap } from '@appsemble/sdk';

bootstrap(({ events, parameters: { stateActions }, utils }) => {
  let state: Record<string, any> = {};

  events.on.onStateChange(({ data, stateAction }: { data: any; stateAction: string }) => {
    if (stateAction && stateActions[stateAction]) {
      state = utils.remap(stateActions[stateAction], {
        data: data || {},
        state,
      }) as Record<string, any>;

      events.emit.stateChanged({ stateAction, state });
    }
  });
});
