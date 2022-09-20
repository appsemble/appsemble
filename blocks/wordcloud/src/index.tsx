import { bootstrap } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';
import WordcloudLogic from './WordcloudLogic';

bootstrap(({ events, parameters: { shape, fields, options}}) => {
  const [data, setData] = useState<string[]>(fields);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onData = (newData: string[], newError: unknown): void => {
      if (newError) {
        setError(true);
        setData(null);
      } else {
        setError(false);
        setData(newData);
      }
    };

    events.on.data(onData);

    return () => {
      events.off.data(onData);
    };
  }, [events]);

  if (error) {
    return <p>Error loading data.</p>;
  }

  if (!data) {
    return <p>No data</p>
  }

  if(!data.length) {
    return <p>Data is empty</p>
  }
  
  return (
    <div>
      <WordcloudLogic 
        shape = {shape}
        words = {fields}
        options = {options}
      />
    </div>
  );
});
