import { Form, FormComponent, Icon, Modal } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';

import Rating from '../Rating';
import messages from './messages';
import styles from './RateApp.css';

interface RateAppProps {
  className: string;
}

export default function RateApp({
  className,
  intl,
}: RateAppProps & WrappedComponentProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [description, setDescription] = React.useState('');
  const openDialog = (): void => setIsOpen(true);
  const closeDialog = (): void => setIsOpen(false);

  const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void =>
    setDescription(event.target.value);
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
        className={styles.modal}
        isActive={isOpen}
        onClose={closeDialog}
        title={<FormattedMessage {...messages.rateApp} />}
      >
        <Form className={styles.controls} onSubmit={submit}>
          <FormComponent label={<FormattedMessage {...messages.rating} />} required>
            <Rating onClick={value => setRating(value)} value={rating} />
          </FormComponent>
          <FormComponent label={<FormattedMessage {...messages.review} />}>
            <textarea
              className="textarea"
              name="description"
              onChange={onDescriptionChange}
              placeholder={intl.formatMessage(messages.descriptionPlaceholder)}
              value={description}
            />
          </FormComponent>
        </Form>
        <footer className="card-footer">
          <button className="card-footer-item" onClick={closeDialog} type="button">
            <FormattedMessage {...messages.cancel} />
          </button>
          <button
            className={classNames('card-footer-item', 'is-primary', styles.cardFooterButton)}
            type="submit"
          >
            <FormattedMessage {...messages.submit} />
          </button>
        </footer>
      </Modal>
    </>
  );
}
