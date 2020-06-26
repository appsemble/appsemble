import {
  Button,
  CardFooterButton,
  Form,
  FormComponent,
  Modal,
  TextArea,
} from '@appsemble/react-components';
import type { App, Rating } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import StarRating from '../Rating';
import messages from './messages';

interface RateAppProps {
  app: App;
  className: string;
  onRate: (rate: Rating) => void;
}

export default function RateApp({ app, className, onRate }: RateAppProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [description, setDescription] = React.useState('');
  const { formatMessage } = useIntl();
  const openDialog = (): void => setIsOpen(true);
  const closeDialog = (): void => setIsOpen(false);

  const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void =>
    setDescription(event.target.value);
  const submit = async (): Promise<void> => {
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
        className="px-0 py-0"
        isActive={isOpen}
        onClose={closeDialog}
        title={<FormattedMessage {...messages.rateApp} />}
      >
        <Form onSubmit={submit}>
          <div className="px-5 py-5">
            <FormComponent label={<FormattedMessage {...messages.rating} />} required>
              <StarRating onClick={(value) => setRating(value)} value={rating} />
            </FormComponent>
            <TextArea
              label={<FormattedMessage {...messages.review} />}
              maxLength={500}
              name="description"
              onChange={onDescriptionChange}
              placeholder={formatMessage(messages.descriptionPlaceholder)}
              value={description}
            />
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
