import { useEffect, useRef, useState } from 'preact/hooks';
import WordCloud from 'wordcloud';

const WordcloudLogic = (props: any) => {
  const [canvasWidth] = useState(1170);
  const [canvasHeight] = useState(760);
  const canvasRef: any = useRef(null);
  const [wordList, setWordList] = useState([]);
  const [optionsList, setOptions] = useState({});

  useEffect(() => {
    canvasRef.current.focus();
    mapArrayToWordcloudObject(props.words);
    setOptions({
      ...props.options,
      ...{ shape: props.shape },
    });
  }, []);

  useEffect(() => {
    if (canvasRef.current != null) {
      WordCloud(canvasRef.current, {
        ...optionsList, 
        ...{ list: wordList }
      });
    }
  }, [wordList]);

  //This turns the given string of words into an array of arrays in the format of [word, size]
  const mapArrayToWordcloudObject = (obj: string[]) => {
    const kvPair: any = {};
    const tempWordlist = [];
    if (wordList.length > 0) return;

    obj.forEach((word) => {
      kvPair[word] = (kvPair[word] || 0) + 1;
    });

    const keys = Object.keys(kvPair);

    for (let i = 0; i < keys.length; i++) {
      tempWordlist.push([keys[i], kvPair[keys[i]]]);
    }
    setWordList(tempWordlist);
  };

  if (!WordCloud.isSupported) return <p>Your browser does not support the Wordcloud block!</p>;

  return (
    <div className="canvasContainer">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          margin: 'auto',
          padding: 0,
          display: 'flex',
        }}
      />
    </div>
  );
};
export default WordcloudLogic;
