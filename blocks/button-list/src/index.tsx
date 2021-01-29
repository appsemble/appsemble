import { bootstrap } from '@appsemble/preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Button } from './components/Button';

bootstrap(({ actions, data: defaultData, events, parameters: { buttons }, ready, utils }) => {
  const [data, setData] = useState<unknown>(defaultData);

  const loadData = useCallback((d: unknown): void => {
    setData(d);
  }, []);

  useEffect(() => {
    events.on.data(loadData);
    ready();
  }, [events, loadData, ready]);

  return (
    <div className="buttons is-centered">
      {buttons.map((button) => (
        // eslint-disable-next-line react/jsx-key
        <Button
          action={button.onClick ? actions[button.onClick] : actions.onClick}
          button={button}
          data={data}
          utils={utils}
        />
      ))}
    </div>
  );
});
