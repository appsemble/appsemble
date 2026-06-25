import { type AppRole, getAppRoles } from '@appsemble/lang-sdk';
import {
  CardFooterButton,
  Form,
  FormComponent,
  Input,
  ModalCard,
  Select,
  type Toggle,
  useMessages,
} from '@appsemble/react-components';
import { type AppInvite } from '@appsemble/types';
import axios from 'axios';
import {
  type ChangeEvent,
  type ClipboardEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { useApp } from '../../index.js';
import { emailPattern } from '@appsemble/utils';

interface AddMembersModalProps {
  /**
   * The state of the modal.
   */
  readonly state: Toggle;

  /**
   * This is called when new people have been invited.
   *
   * @param invites The newly added invites.
   */
  readonly onInvited: (invites: AppInvite[]) => void;
}

/**
 * A modal form for inviting one or more people to the organization.
 */
export function AddMembersModal({ onInvited, state }: AddMembersModalProps): ReactNode {
  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const appRoles = getAppRoles(app.definition.security);
  const defaultInvite = useMemo(
    () => ({
      email: '',
      roles: appRoles.length ? [appRoles[0]] : [],
    }),
    [appRoles],
  );
  const [invites, setInvites] = useState<AppInvite[]>([defaultInvite]);
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setInvites([defaultInvite]);
    state.disable();
  }, [defaultInvite, state]);

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post<AppInvite[]>(
        `/api/apps/${app?.id}/invites`,
        invites.filter(({ email }) => email),
      );
      onInvited(data);
    } catch {
      setSubmitting(false);
      push(formatMessage(messages.error));
      return;
    }
    state.disable();
    setSubmitting(false);
    setInvites([defaultInvite]);
  }, [app?.id, defaultInvite, formatMessage, invites, onInvited, push, state]);

  const updateInvite = useCallback(
    (index: number, field: 'email' | 'roles', value: string | string[]) => {
      setInvites((prevInvites) => {
        const copy = [...prevInvites];
        copy[index] = {
          ...copy[index],
          [field]:
            field === 'roles' ? (Array.isArray(value) ? value : value ? [value] : []) : value,
        };
        if (field === 'email' && index === prevInvites.length - 1 && value) {
          copy.push(defaultInvite);
        }
        return copy;
      });
    },
    [defaultInvite],
  );

  const onEmailChange = useCallback(
    ({ currentTarget: { id } }: ChangeEvent<HTMLInputElement>, value: number | string) => {
      const [, i] = id.split('-');
      updateInvite(Number(i), 'email', String(value));
    },
    [updateInvite],
  );

  const onRolesChange = useCallback(
    ({ currentTarget: { id } }: ChangeEvent<HTMLSelectElement>, value: string | string[]) => {
      const [, i] = id.split('-');
      updateInvite(Number(i), 'roles', value);
    },
    [updateInvite],
  );

  const onBlur = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) => {
      const [, i] = currentTarget.id.split('-');
      const index = Number(i);
      if (index + 1 === invites.length || invites.length === 1) {
        return;
      }

      const member = { ...invites[index], email: currentTarget.value };
      if (!member.email) {
        setInvites([...invites.slice(0, index), ...invites.slice(index + 1)]);
      }
    },
    [invites],
  );

  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      const [, i] = event.currentTarget.id.split('-');
      const index = Number(i);

      const text = event.clipboardData.getData('Text');
      if (!text) {
        return;
      }

      // The user pasted non-tsv data.
      if (!text.includes('\t') && !text.includes('\n')) {
        return;
      }

      // Prevent the change event from triggering..
      event.preventDefault();

      // Let’s not assume what line endings the user is pasting.
      const lines = text.split(/\r?\n/gu).filter(Boolean);
      if (!lines.length) {
        return;
      }

      setInvites([
        ...invites.slice(0, index),
        ...lines.map((line) => {
          const [email] = line.split('\t');
          return { email, roles: appRoles.length ? [appRoles[0]] : [] };
        }),
        ...invites.slice(index),
      ]);
    },
    [appRoles, invites],
  );

  return (
    <ModalCard
      component={Form}
      footer={
        <>
          <CardFooterButton onClick={reset}>
            <FormattedMessage {...messages.cancel} />
          </CardFooterButton>
          <CardFooterButton color="primary" type="submit">
            <FormattedMessage {...messages.submit} />
          </CardFooterButton>
        </>
      }
      isActive={state.enabled}
      onClose={reset}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.title} />}
    >
      <FormComponent
        help={<FormattedMessage {...messages.help} />}
        id={`email-${invites.length - 1}`}
        label={<FormattedMessage {...messages.email} />}
        required
      >
        {invites.map((member, index) => (
          <div
            className="mb-2 is-flex"
            // eslint-disable-next-line react/no-array-index-key
            key={index}
          >
            <Input
              className="mr-2"
              disabled={submitting}
              id={`email-${index}`}
              name="email"
              onBlur={onBlur}
              onChange={onEmailChange}
              onPaste={onPaste}
              pattern={emailPattern}
              required
              type="email"
              value={member.email}
            />
            <Select
              disabled={submitting}
              id={`roles-${index}`}
              multiple
              name="roles"
              onChange={onRolesChange}
              size={Math.min(Math.max(appRoles.length, 2), 6)}
              value={member.roles}
            >
              {appRoles.map((r: AppRole) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </FormComponent>
    </ModalCard>
  );
}
