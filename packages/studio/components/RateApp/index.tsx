import {
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TextAreaField,
  useToggle,
} from '@appsemble/react-components';
import { type App, type Rating } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { RatingField } from '../RatingField/index.js';

interface RateAppProps {
  readonly app: App;
  readonly className: string;
  readonly onRate: (rate: Rating) => void;
}

export function RateApp({ app, onRate }: RateAppProps): ReactNode {
  const modal = useToggle();
  const { formatMessage } = useIntl();

  const defaultValues = { rating: 0, description: '' };
  const submit = useCallback(
    async (values: typeof defaultValues) => {
      const { data } = await axios.post<Rating>(`/api/apps/${app.id}/ratings`, values);
      onRate(data);
      modal.disable();
    },
    [app, onRate, modal],
  );

  return (
    <>
      <Button icon="pencil-alt" onClick={modal.enable}>
        <FormattedMessage {...messages.rateApp} />
      </Button>
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultValues}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={modal.disable}
            submitLabel={<FormattedMessage {...messages.submit} />}
          />
        }
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={submit}
        resetOnSuccess
        title={<FormattedMessage {...messages.rateApp} />}
      >
        <SimpleFormField
          component={RatingField}
          label={<FormattedMessage {...messages.rating} />}
          name="rating"
          required
        />
        <SimpleFormField
          component={TextAreaField}
          label={<FormattedMessage {...messages.review} />}
          maxLength={500}
          name="description"
          placeholder={formatMessage(messages.descriptionPlaceholder)}
        />
      </ModalCard>
    </>
  );
}
