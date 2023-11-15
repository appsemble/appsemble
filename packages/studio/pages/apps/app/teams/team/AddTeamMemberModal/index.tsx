import {
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  type Toggle,
  useData,
} from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { AsyncDataView } from '../../../../../../components/AsyncDataView/index.js';
import { type Member, type TeamMember } from '../../../../../../types.js';
import { useApp } from '../../../index.js';

interface AddTeamMemberModalProps {
  readonly teamMembers: TeamMember[];
  readonly toggle: Toggle;
  readonly onAdd: (id: string) => Promise<void>;
}

export function AddTeamMemberModal({
  onAdd,
  teamMembers,
  toggle,
}: AddTeamMemberModalProps): ReactNode {
  const { app } = useApp();
  const result = useData<Member[]>(`/api/apps/${app.id}/members`);
  const onSubmit = useCallback(({ memberId }: typeof defaultValues) => onAdd(memberId), [onAdd]);

  const defaultValues = {
    memberId: result?.data?.find((member) => !teamMembers.map((tm) => tm.id).includes(member.id))
      ?.id,
  };

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={defaultValues}
      footer={
        <SimpleModalFooter
          allowPristine={false}
          cancelLabel={<FormattedMessage {...messages.cancel} />}
          onClose={toggle.disable}
          submitLabel={<FormattedMessage {...messages.addMember} />}
        />
      }
      isActive={toggle.enabled}
      onClose={toggle.disable}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.addingMember} />}
    >
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noMembers} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(members) => (
          <SimpleFormField
            component={SelectField}
            defaultValue={members?.[0]?.id}
            label={<FormattedMessage {...messages.member} />}
            name="memberId"
            required
          >
            {members
              .filter((member) => !teamMembers.map((tm) => tm.id).includes(member.id))
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.primaryEmail || member.id}
                </option>
              ))}
          </SimpleFormField>
        )}
      </AsyncDataView>
    </ModalCard>
  );
}
