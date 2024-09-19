import {
  Button,
  Content,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { type Group, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../components/HeaderControl/index.js';
import { ListButton } from '../../../../../components/ListButton/index.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';

const newGroup: Omit<Group, 'annotations' | 'id'> = {
  name: '',
};

/**
 * Render a list of groups.
 *
 * The rendered list items are links to the group settings page.
 */
export function IndexPage(): ReactNode {
  const { formatMessage } = useIntl();

  const { app } = useApp();
  const { organizations } = useUser();

  const modal = useToggle();

  const result = useData<Group[]>(`/api/apps/${app.id}/groups`);
  const { setData: setGroups } = result;

  const submitGroup = useCallback(
    async ({ name }: Group) => {
      const { data } = await axios.post<Group>(`/api/apps/${app.id}/groups`, {
        name,
      });
      setGroups((groups) => [...groups, data]);
      modal.disable();
    },
    [modal, app, setGroups],
  );

  const organization = organizations.find((o) => o.id === app.OrganizationId);
  const mayCreateGroup =
    organization &&
    checkOrganizationRoleOrganizationPermissions(organization.role, [
      OrganizationPermission.CreateGroups,
    ]);

  return (
    <>
      <HeaderControl
        control={
          mayCreateGroup ? (
            <Button onClick={modal.enable}>
              <FormattedMessage {...messages.createButton} />
            </Button>
          ) : null
        }
      >
        <FormattedMessage {...messages.groups} />
      </HeaderControl>
      <Content fullwidth main padding>
        <AsyncDataView
          emptyMessage={<FormattedMessage {...messages.noGroups} />}
          errorMessage={<FormattedMessage {...messages.error} />}
          loadingMessage={<FormattedMessage {...messages.loading} />}
          result={result}
        >
          {(groups) => (
            <ul>
              {groups.map((group) => (
                <ListButton
                  alt={formatMessage(messages.logo)}
                  icon="users"
                  key={group.id}
                  title={group.name || group.id}
                  to={String(group.id)}
                />
              ))}
            </ul>
          )}
        </AsyncDataView>
        <ModalCard
          component={SimpleForm}
          defaultValues={newGroup}
          footer={
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
              onClose={modal.disable}
              submitLabel={<FormattedMessage {...messages.createButton} />}
            />
          }
          isActive={modal.enabled}
          onClose={modal.disable}
          onSubmit={submitGroup}
          resetOnSuccess
          title={<FormattedMessage {...messages.creatingNewGroup} />}
        >
          <SimpleFormField
            icon="briefcase"
            label={<FormattedMessage {...messages.groupName} />}
            name="name"
            required
          />
        </ModalCard>
      </Content>
    </>
  );
}
