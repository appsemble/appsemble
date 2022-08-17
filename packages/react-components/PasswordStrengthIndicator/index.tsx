import { zxcvbn, ZxcvbnResult } from '@zxcvbn-ts/core';
import classNames from 'classnames';
import { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useSimpleForm } from '../index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

type PartialResult = Pick<ZxcvbnResult, 'feedback' | 'score'>;

interface PasswordStrengthIndicatorProps {
  name: string;
  minLength: number;
}

const emptyResult: PartialResult = {
  score: -1,
  feedback: {
    suggestions: ['required'],
    warning: 'required',
  },
};

/**
 * A password strength indicator using simple form.
 */
export function PasswordStrengthIndicator({
  minLength,
  name,
}: PasswordStrengthIndicatorProps): ReactElement {
  const { pristine, values } = useSimpleForm();
  const [result, setResult] = useState(emptyResult);

  const value = values[name];
  useEffect(() => {
    if (value) {
      let isCurrent = true;
      Promise.resolve(zxcvbn(value)).then((r) => {
        if (isCurrent) {
          setResult(r);
        }
      });
      return () => {
        isCurrent = false;
      };
    }
    setResult(emptyResult);
  }, [value]);

  const {
    feedback: {
      warning,
      suggestions: [suggestion],
    },
    score,
  } = result;

  const messageId =
    value.length < minLength ? 'minLength' : ((warning || suggestion) as keyof typeof messages);

  return (
    <div>
      <progress
        className={classNames(`progress is-small ${styles.progress}`, {
          'is-danger': score === 0,
          'is-warning': score === 1,
          'is-info': score === 3,
          'is-success': score === 4,
        })}
        max={5}
        value={score + 1}
      />
      {!pristine[name] && messageId ? <FormattedMessage {...messages[messageId]} /> : null}
    </div>
  );
}
