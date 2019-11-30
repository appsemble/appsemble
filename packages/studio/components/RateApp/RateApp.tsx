import { Form, FormComponent, Icon, Modal } from '@appsemble/react-components';
import { App, Message, Rating } from '@appsemble/types';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';

import StarRating from '../Rating';
import messages from './messages';
import styles from './RateApp.css';

interface RateAppProps {
  app: App;
  className: string;
  onRate: (rate: Rating) => void;
  push: (message: Message) => void;
}

export default function RateApp({
  app,
  className,
  intl,
  onRate,
}: RateAppProps & WrappedComponentProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [description, setDescription] = React.useState('');
  const openDialog = (): void => setIsOpen(true);
  const closeDialog = (): void => setIsOpen(false);

  const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void =>
    setDescription(event.target.value);
  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const { data } = await axios.post(`/api/apps/${app.id}/ratings`, { rating, description });
    onRate(data);
    setRating(0);
    setDescription('');
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
        <Form onSubmit={submit}>
          <div className={styles.controls}>
            <FormComponent label={<FormattedMessage {...messages.rating} />} required>
              <StarRating onClick={value => setRating(value)} value={rating} />
            </FormComponent>
            <FormComponent id="description" label={<FormattedMessage {...messages.review} />}>
              <textarea
                className="textarea"
                id="description"
                maxLength={500}
                name="description"
                onChange={onDescriptionChange}
                placeholder={intl.formatMessage(messages.descriptionPlaceholder)}
                value={description}
              />
            </FormComponent>
          </div>

          <footer className="card-footer">
            <button
              className={`card-footer-item button is-white ${styles.cardFooterButton}`}
              onClick={closeDialog}
              type="button"
            >
              <FormattedMessage {...messages.cancel} />
            </button>
            <button
              className={`card-footer-item button is-primary ${styles.cardFooterButton}`}
              disabled={rating === 0}
              type="submit"
            >
              <FormattedMessage {...messages.submit} />
            </button>
          </footer>
        </Form>
      </Modal>
    </>
  );
}
