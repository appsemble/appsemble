import { bootstrap } from '@appsemble/preact';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import Button from './components/Button';

bootstrap(({ actions, data: defaultData, events, parameters: { buttons }, ready, utils }) => {
  const [data, setData] = useState<any>(defaultData);

  const loadData = useCallback((d: any): void => {
    setData(d);
  }, []);

  useEffect(() => {
    events.on.data(loadData);
    ready();
  }, [events, loadData, ready]);

  return (
    <div className="buttons is-centered">
      {buttons.map((button, index) => (
        <Button
          action={button.onClick ? actions[button.onClick] : actions.onClick}
          button={button}
          data={data}
          data-index={index}
          utils={utils}
        />
      ))}
    </div>
  );
});
