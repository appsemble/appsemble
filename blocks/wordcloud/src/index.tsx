import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';

import { WordcloudLogic } from './WordcloudLogic/WordcloudLogic.js';

// Sorts the data to be an array of strings to feed to the Wordcloud logic layer
function sortData(givenWordsList: any): string[] {
  const filteredList: string[] = [];

  function getDataType(unknownData: any): void {
    if (Array.isArray(unknownData)) {
      for (const element of unknownData) {
        getDataType(element);
      }
    } else if (typeof unknownData === 'object') {
      for (const item of Object.values(unknownData as object)) {
        getDataType(item);
      }
    } else if (typeof unknownData === 'string') {
      filteredList.push(unknownData);
    } else if (unknownData == null) {
      // Don't need to return anything
    } else {
      filteredList.push(unknownData.String());
    }
  }
  getDataType(givenWordsList);

  return filteredList;
}

bootstrap(({ events, parameters: { fields, options, shape = 'circle' }, ready, utils }) => {
  const [data, setData] = useState<any>(fields);
  const [error, setError] = useState(false);

  useEffect(() => {
    const values: any[] = [];
    const hasListener = events.on.data((newData: []) => {
      for (const field of fields) {
        if (typeof field === 'object') {
          newData.map((element: object) => {
            values.push(utils.remap(field, element));
          });
        } else {
          values.push(field);
        }
      }
      setData(sortData(values));
      setError(false);
    });
    setError(hasListener);
    ready();
  }, [events, ready]);

  if (error) {
    return <FormattedMessage id="error" />;
  }

  if (!data) {
    return <FormattedMessage id="loading" />;
  }

  if (!data.length) {
    return <FormattedMessage id="empty" />;
  }

  return <WordcloudLogic options={options} shape={shape} words={data} />;
});
