import { FormattedMessage } from '@appsemble/preact';
import { VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import WordCloud from 'wordcloud';

import styles from './wordcloud.module.css';

function mapArrayToWordcloudObject(obj: string[]): object[] {
  const kvPair: any = {};
  const tempWordlist = [];

  for (const word of obj) {
    kvPair[word] = (kvPair[word] || 0) + 1;
  }

  const keys = Object.keys(kvPair);

  for (const key of keys) {
    tempWordlist.push([key, kvPair[key]]);
  }
  return tempWordlist;
}

interface WordcloudProps {
  readonly shape: string;
  readonly options: object;
  readonly words: string[];
}

export function WordcloudLogic(props: WordcloudProps): VNode {
  const canvasRef = useRef<HTMLCanvasElement>();
  const canvasWidth = 1170;
  const canvasHeight = 760;

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const list = mapArrayToWordcloudObject(props.words);

    WordCloud(canvasRef.current, {
      color: '#000000',
      rotateRatio: 0,
      ...props.options,
      list,
    });
  }, [props.options, props.words]);

  if (!WordCloud.isSupported) {
    return <FormattedMessage id="unsupported" />;
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
}
