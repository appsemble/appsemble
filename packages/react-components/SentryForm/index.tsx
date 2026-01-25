import { captureMessage } from '@sentry/browser';
import axios from 'axios';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import {
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  TextAreaField,
} from '../index.js';
import { emailPattern } from '@appsemble/utils';

interface SentryFormProps {
  /**
   * The Sentry DSN to use.
   */
  readonly dsn: string;

  /**
   * The user email value that is filled in by default.
   */
  readonly email?: string;

  /**
   * If an event has been captured, use pass the generated event ID here.
   *
   * If this is unspecified, a new event called will be generated called `Feedback`.
   */
  readonly eventId?: string;

  /**
   * The user name value that is filled in by default.
   */
  readonly name?: string;

  /**
   * A component that can be used to recover from the current situation.
   *
   * Typically this is a link button.
   */
  readonly recovery?: ReactNode;
}

/**
 * This component renders a form for submitting feedback to Sentry.
 *
 * This uses the API call that would be made by the builtin Sentry feedback report screen.
 *
 * @see https://github.com/getsentry/sentry-javascript/issues/3111
 */
export function SentryForm({
  dsn,
  email,
  eventId,
  name,
  recovery = null,
}: SentryFormProps): ReactNode {
  const [submitted, setSubmitted] = useState(false);

  const defaultValues = useMemo(
    () => ({ comments: '', email: email || '', name: name || '' }),
    [email, name],
  );

  const submit = useCallback(
    async (values: typeof defaultValues) => {
      const formData = new FormData();
      formData.set('comments', values.comments);
      formData.set('email', values.email);
      formData.set('name', values.name);
      const { host } = new URL(decodeURI(dsn));
      await axios.post(`https://${dsn ? host : 'sentry.io'}/api/embed/error-page/`, formData, {
        params: { eventId: eventId || captureMessage('Feedback', 'info'), dsn },
      });
      setSubmitted(true);
    },
    [dsn, eventId],
  );

  if (!dsn) {
    return recovery;
  }

  if (submitted) {
    return (
      <>
        <Message color="success">
          <FormattedMessage {...messages.submitSuccess} />
        </Message>
        {recovery}
      </>
    );
  }

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={submit}>
      <p className="content">
        <FormattedMessage {...messages.disclaimer} />
      </p>
      <SimpleFormError>{() => <FormattedMessage {...messages.submitError} />}</SimpleFormError>
      <SimpleFormField
        help={<FormattedMessage {...messages.nameHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
        required
      />
      <SimpleFormField
        autoComplete="email"
        help={<FormattedMessage {...messages.emailHelp} />}
        icon="envelope"
        label={<FormattedMessage {...messages.emailLabel} />}
        name="email"
        pattern={emailPattern}
        required
        type="email"
        validityMessages={{
          typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
          patternMismatch: <FormattedMessage {...messages.emailInvalid} />,
          valueMissing: <FormattedMessage {...messages.emailRequired} />,
        }}
      />
      <SimpleFormField
        component={TextAreaField}
        help={<FormattedMessage {...messages.commentsHelp} />}
        label={<FormattedMessage {...messages.commentsLabel} />}
        name="comments"
        required
      />
      <FormButtons>
        {recovery}
        <SimpleSubmit>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
