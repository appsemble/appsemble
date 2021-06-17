import { useSimpleForm } from '@appsemble/react-components';
import { zxcvbn } from '@zxcvbn-ts/core';
import classNames from 'classnames';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages';

interface PasswordStrengthIndicatorProps {
  name: string;
  minLength: number;
}

const emptyResult = {
  score: -1,
  feedback: {
    suggestions: ['required'],
    warning: 'required',
  },
} as const;

/**
 * A password strength indicator using simple form.
 */
export function PasswordStrengthIndicator({
  minLength,
  name,
}: PasswordStrengthIndicatorProps): ReactElement {
  const { pristine, values } = useSimpleForm();

  const value = values[name];

  const result = value ? zxcvbn(value) : emptyResult;
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
