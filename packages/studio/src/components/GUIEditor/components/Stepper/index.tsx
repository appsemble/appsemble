import { Button } from '@appsemble/react-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.css';
import messages from './messages';

interface StepperProps {
  leftOnClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  rightOnClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  rightDisabled: boolean;
  rightMessage?: React.ReactElement;
}

export default function Stepper({
  leftOnClick,
  rightDisabled,
  rightMessage,
  rightOnClick,
}: StepperProps): React.ReactElement {
  return (
    <div className={styles.footer}>
      <Button className="button is-warning" icon="angle-left" onClick={leftOnClick}>
        <FormattedMessage {...messages.back} />
      </Button>
      <Button
        className="button is-success"
        disabled={rightDisabled}
        icon="angle-right"
        iconPrefix="fas"
        iconRight
        onClick={rightOnClick}
      >
        {rightMessage || <FormattedMessage {...messages.next} />}
      </Button>
    </div>
  );
}
