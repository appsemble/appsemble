import { Form, Icon, Modal } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import Rating from '../Rating';
import messages from './messages';

interface RateAppProps {
  className: string;
}

export default function RateApp({ className }: RateAppProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const openDialog = (): void => setIsOpen(true);
  const closeDialog = (): void => setIsOpen(false);
  const submit = async (): Promise<void> => {
    await axios.post('/api/apps/1/ratings', { rating });
    closeDialog();
  };

  return (
    <>
      <button
        className={classNames('button', 'is-primary', className)}
        onClick={openDialog}
        type="button"
      >
        <span>
          <FormattedMessage {...messages.rateApp} />
        </span>
        <Icon icon="pencil-alt" />
      </button>
      <Modal
        isActive={isOpen}
        onClose={closeDialog}
        title={<FormattedMessage {...messages.rateApp} />}
      >
        <Form onSubmit={submit}>
          <Rating onClick={value => setRating(value)} value={rating} />
        </Form>
      </Modal>
    </>
  );
}
