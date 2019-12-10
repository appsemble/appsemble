import { Button, CardFooterButton, Form, FormComponent, Modal } from '@appsemble/react-components';
import { App, Rating } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import StarRating from '../Rating';
import messages from './messages';
import styles from './RateApp.css';

interface RateAppProps {
  app: App;
  className: string;
  onRate: (rate: Rating) => void;
}

export default function RateApp({ app, className, onRate }: RateAppProps): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [description, setDescription] = React.useState('');
  const intl = useIntl();
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
      <Button className={className} color="primary" icon="pencil-alt" onClick={openDialog}>
        <FormattedMessage {...messages.rateApp} />
      </Button>
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
            <CardFooterButton onClick={closeDialog}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="primary" disabled={rating === 0} type="submit">
              <FormattedMessage {...messages.submit} />
            </CardFooterButton>
          </footer>
        </Form>
      </Modal>
    </>
  );
}
