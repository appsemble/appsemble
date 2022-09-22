import { bootstrap } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';
import WordcloudLogic from './WordcloudLogic';

bootstrap(({ events, parameters: { shape, fields, options } }) => {
  const [data, setData] = useState<any>(fields);
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

  useEffect(() => {
    setData(sortData(data));
  }, []);

  //This sets the data to an array of strings if needed/possible to feed to the wordcloud logic layer
  const sortData = (data: any) => {
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'object') {
      const filteredList: string[] = Object.values(data as object).filter(
        (item) => typeof item === 'string',
      );
      return filteredList;
    } else if (typeof data === 'string') {
      return [data];
    } else {
      throw new Error('Data type is not supported!');
    }
  };

  if (error) {
    return <p>Error loading data.</p>;
  }

  if (!data) {
    return <p>No data</p>;
  }

  if (!data.length) {
    return <p>Data is empty</p>;
  }

  return (
    <div>
      <WordcloudLogic shape={shape} words={data} options={options} />
    </div>
  );
});
