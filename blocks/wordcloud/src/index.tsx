import { bootstrap } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';
import WordcloudLogic from './WordcloudLogic';

bootstrap(({ events, parameters: { shape, fields, options }, ready, utils }) => {
  const [data, setData] = useState<any>(fields);
  const [error, setError] = useState(false);
  console.log('Begin of block')

  useEffect(() => {
    const hasListener = events.on.data((newData: []) => {
      const values = newData.map((element: object)  => 
        utils.remap(fields, element)
      );
      setData(sortData(values))
      setError(false);
    })
    setError(hasListener)
    ready()
  }, [events, ready])

  //Sorts the data to be an array of strings to feed to the wordcloud logic layer
  const sortData = (givenWordsList: any) => {
    let filteredList: string[] = [];
    getDataType(givenWordsList)

    function getDataType(data: any) {
      if (Array.isArray(data)) {
        data.forEach((element) => {
          getDataType(element);
        });
      } else if (typeof data === 'object') {
        Object.values(data as object).forEach((item) => {
          console.log('Item ', item)
          getDataType(item)
        });
      } else if (typeof data === 'string') {
        filteredList.push(data);
      } else {
        return;
      } 
    }
    return filteredList;
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
      <WordcloudLogic shape={shape} words={data} options={options} fields={fields} />
    </div>
  );
});
