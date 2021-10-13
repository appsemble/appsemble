import {
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TextAreaField,
  useToggle,
} from '@appsemble/react-components';
import { App, Rating } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { RatingField } from '../RatingField';
import { messages } from './messages';

interface RateAppProps {
  app: App;
  className: string;
  onRate: (rate: Rating) => void;
}

export function RateApp({ app, onRate }: RateAppProps): ReactElement {
  const modal = useToggle();
  const { formatMessage } = useIntl();

  const submit = useCallback(
    async (values) => {
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
        defaultValues={{ rating: 0, description: '' }}
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
          // @ts-expect-error XXX This shouldn’t be needed.
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
