import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useIntl } from '../IntlProvider/index.js';

interface DotProgressBarProps {
  readonly amount: number;
  readonly active: number;
}

export function DotProgressBar({ active, amount }: DotProgressBarProps): VNode {
  const { formatMessage } = useIntl();

  return (
    <div className={`${styles.dotContainer} mr-1`}>
      <progress
        aria-label={formatMessage(messages.progress)}
        aria-valuetext={formatMessage(messages.step, { step: active + 1, total: amount })}
        className="is-sr-only"
        max={amount}
        value={active + 1}
      />
      {Array.from({ length: amount }, (unused, index) => (
        <div
          className={classNames('is-inline-block mx-1', styles.dot, {
            [styles.previous]: index < active,
            [styles.active]: index === active,
          })}
          key={index}
        />
      ))}
    </div>
  );
}
