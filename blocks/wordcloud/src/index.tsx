import { bootstrap } from '@appsemble/preact';
import { useEffect, useState } from 'preact/hooks';
import Wordcloud from 'react-wordcloud';

bootstrap(({ events, parameters: { fields } }) => {
  const [data, setData] = useState<any[]>(fields);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onData = (newData: unknown[], newError: unknown): void => {
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
    //Set mock data
    const dataset = [
      "text",
      "text",
      "text",
      "text",
      "text",
      "text",
      "text",
      "text",
      "text",
      "banana",
      "banana",
      "banana",
      "banana",
      "banana",
      "car",
      "car",
      "car",
      "car",
      "car",
      "car",
    ]
    setData(dataset)
  }

  interface WordcloudItem {
    text: string;
    value: number
  }
  
  const wordList: WordcloudItem[] = [];
  
  const mapObjectToWordcloudItem = (obj: string[]) => 
  {
    const kvPair: any = {}
  
    obj.forEach((word) => {
      kvPair[word] = (kvPair[word] || 0) + 1
    })
  
    const keys = Object.keys(kvPair)
    
    for(let i = 0; i < keys.length; i++) {
      wordList.push({
        'text': keys[i],
        'value': kvPair[keys[i]]
      })
    }
  }
  
  mapObjectToWordcloudItem(data)

  return (
    <div>
      <Wordcloud words={wordList} />
    </div>
  );
});
