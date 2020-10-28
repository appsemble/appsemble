import { bootstrap } from '@appsemble/sdk';

bootstrap(({ events, parameters: { interval }, utils }) => {
  const intervalId = setInterval(events.emit.interval, interval * 1e3);

  utils.addCleanup(() => clearInterval(intervalId));
});
