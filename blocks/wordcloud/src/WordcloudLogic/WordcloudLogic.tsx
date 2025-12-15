import { FormattedMessage } from '@appsemble/preact';
import { type VNode } from 'preact';
import { type MutableRef, useEffect, useRef } from 'preact/hooks';
import WordCloud, { type ListEntry, type Options } from 'wordcloud';

import styles from './wordcloud.module.css';

function mapArrayToWordcloudObject(words: string[]): ListEntry[] {
  const kvPair: Record<string, number> = Object.create(null);

  for (const word of words) {
    kvPair[word] = (kvPair[word] || 0) + 1;
  }

  return Object.entries(kvPair);
}

interface WordcloudProps {
  readonly shape:
    | 'cardioid'
    | 'circle'
    | 'diamond'
    | 'pentagon'
    | 'square'
    | 'star'
    | 'triangle-forward'
    | 'triangle';
  readonly options: Options;
  readonly words: string[];
}

export function WordcloudLogic({ shape = 'circle', options, words }: WordcloudProps): VNode {
  const canvasRef = useRef<HTMLCanvasElement>();
  const canvasWidth = Math.floor(window.innerWidth * 0.61);
  const canvasHeight = Math.floor(window.innerHeight * 0.82);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const list = mapArrayToWordcloudObject(words);

    WordCloud(canvasRef.current, {
      ...options,
      color: '#000000',
      rotateRatio: 0,
      list,
      shape,
    });
  }, [options, shape, words]);

  if (!WordCloud.isSupported) {
    return <FormattedMessage id="unsupported" />;
  }

  return (
    <canvas
      className={styles.centerCloud}
      height={canvasHeight}
      ref={(canvasRef as MutableRef<HTMLCanvasElement>) || undefined}
      width={canvasWidth}
    />
  );
}
