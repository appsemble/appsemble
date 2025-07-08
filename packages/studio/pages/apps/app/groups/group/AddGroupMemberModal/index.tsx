import { type AppMemberInfo, type AppRole, getAppRoles } from '@appsemble/lang-sdk';
import {
  CardFooterButton,
  Form,
  FormComponent,
  Input,
  ModalCard,
  Select,
  type Toggle,
  useData,
  useMessages,
} from '@appsemble/react-components';
import { type GroupInvite } from '@appsemble/types';
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
import { useApp } from '../../../index.js';

interface AddMembersModalProps {
  /**
   * The id of the group.
   */
  readonly groupId: number;

  /**
   * The state of the modal.
   */
  readonly state: Toggle;

  /**
   * This is called when new people have been invited.
   *
   * @param invites The newly added invites.
   */
  readonly onInvited: (invites: GroupInvite[]) => void;
}

export function AddGroupMemberModal({
  groupId,
  onInvited,
  state,
}: AddMembersModalProps): ReactNode {
  const { app } = useApp();
  const { formatMessage } = useIntl();

  const push = useMessages();
  const roleKeys = getAppRoles(app.definition.security);
  const defaultInvite = useMemo(
    () => ({
      email: '',
      role: roleKeys[0],
    }),
    [roleKeys],
  );
  const [invites, setInvites] = useState<GroupInvite[]>([defaultInvite]);
  const [submitting, setSubmitting] = useState(false);

  const { data: members } = useData<AppMemberInfo[]>(
    `/api/apps/${app.id}/${app.demoMode ? 'demo-' : ''}members`,
  );

  const reset = useCallback(() => {
    setInvites([defaultInvite]);
    state.disable();
  }, [defaultInvite, state]);

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post<GroupInvite[]>(
        `/api/groups/${groupId}/invites`,
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
  }, [defaultInvite, formatMessage, groupId, invites, onInvited, push, state]);

  const onChange = useCallback(
    (
      { currentTarget: { id } }: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      value: string,
    ) => {
      const [field, i] = id.split('-');
      const index = Number(i);

      const copy = [...invites];
      copy[index] = { ...invites[index], [field]: value };
      if (index === invites.length - 1) {
        copy.push(defaultInvite);
      }
      setInvites(copy);
    },
    [defaultInvite, invites],
  );

  const onBlur = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) => {
      const [field, i] = currentTarget.id.split('-');
      const index = Number(i);
      if (index + 1 === invites.length || invites.length === 1) {
        return;
      }

      const member = { ...invites[index], [field]: currentTarget.value };
      if (Object.values(member).every((value) => !value)) {
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
          const [email, name] = line.split('\t');
          return { email, name, role: 'Member' };
        }),
        ...invites.slice(index),
      ]);
    },
    [invites],
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
              datalist={(members || []).map((m) => m.email)}
              disabled={submitting}
              id={`email-${index}`}
              name="email"
              onBlur={onBlur}
              onChange={onChange}
              onPaste={onPaste}
              required
              type="email"
              value={member.email}
            />
            <Select
              disabled={submitting}
              id={`role-${index}`}
              name="role"
              onChange={onChange}
              value={member.role}
            >
              {roleKeys.map((r: AppRole) => (
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
