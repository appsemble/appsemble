import { VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import WordCloud from 'wordcloud';

import styles from './wordcloud.module.css';

const WordcloudLogic = (props: any): VNode => {
  const [canvasWidth] = useState(1170);
  const [canvasHeight] = useState(760);
  const canvasRef: any = useRef(null);
  const [wordList, setWordList] = useState([]);
  const [optionsList, setOptions] = useState({});

  // This turns the given string of words into an array of arrays in the format of [word, size]
  const mapArrayToWordcloudObject = (obj: string[]): void => {
    const kvPair: any = {};
    const tempWordlist = [];
    if (wordList.length > 0) {
      return;
    }

    for (const word of obj) {
      kvPair[word] = (kvPair[word] || 0) + 1;
    }

    const keys = Object.keys(kvPair);

    for (const key of keys) {
      tempWordlist.push([key, kvPair[key]]);
    }
    setWordList(tempWordlist);
    return null;
  };

  useEffect(() => {
    const propOptions = props.options;
    canvasRef.current.focus();
    mapArrayToWordcloudObject(props.words);
    setOptions({
      ...propOptions,
      ...(propOptions.color = propOptions.color || '#000000'),
      ...(propOptions.rotateRatio = propOptions.rotateRatio || 0),
      shape: props.shape,
    });
  }, []);

  useEffect(() => {
    if (canvasRef.current != null) {
      WordCloud(canvasRef.current, {
        ...optionsList,
        list: wordList,
      });
    }
  }, [wordList]);

  if (!WordCloud.isSupported) {
    return <p id="unsupported" />;
  }

  return (
    <div className="canvasContainer">
      <canvas
        className={styles.centerCloud}
        height={canvasHeight}
        ref={canvasRef}
        width={canvasWidth}
      />
    </div>
  );
};
export default WordcloudLogic;
