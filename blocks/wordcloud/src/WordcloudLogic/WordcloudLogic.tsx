import { FormattedMessage, useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';
import { type MutableRef, useEffect, useMemo, useRef } from 'preact/hooks';
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
  const {
    parameters: { description },
    utils,
  } = useBlock();
  const name = (utils.remap(description, {}) as string) || utils.formatMessage('wordcloud');
  const canvasRef = useRef<HTMLCanvasElement>();
  const canvasWidth = Math.floor(window.innerWidth * 0.61);
  const canvasHeight = Math.floor(window.innerHeight * 0.82);

  const list = useMemo(() => mapArrayToWordcloudObject(words), [words]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    WordCloud(canvasRef.current, {
      ...options,
      color: '#000000',
      rotateRatio: 0,
      list,
      shape,
    });
  }, [list, options, shape]);

  if (!WordCloud.isSupported) {
    return <FormattedMessage id="unsupported" />;
  }

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- A canvas has no text alternative of its own */}
      <canvas
        aria-label={name}
        className={styles.centerCloud}
        height={canvasHeight}
        ref={(canvasRef as MutableRef<HTMLCanvasElement>) || undefined}
        // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
        role="img"
        width={canvasWidth}
      />
      <ul aria-label={name} className="is-sr-only">
        {list
          .toSorted(([, a], [, b]) => b - a)
          .map(([word, count]) => (
            <li key={word}>{utils.formatMessage('wordFrequency', { count, word })}</li>
          ))}
      </ul>
    </>
  );
}
