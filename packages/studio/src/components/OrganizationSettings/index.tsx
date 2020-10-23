import {
  Button,
  CardFooterButton,
  Content,
  FileUpload,
  Loader,
  Message,
  Modal,
  SimpleForm,
  SimpleFormField,
  Subtitle,
  Table,
  Title,
  useData,
  useObjectURL,
  useToggle,
} from '@appsemble/react-components';
import type { OrganizationInvite } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import React, { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import type { Member } from '../../types';
import { checkRole } from '../../utils/checkRole';
import { HeaderControl } from '../HeaderControl';
import { useUser } from '../UserProvider';
import { AddMembersModal } from './AddMembersModal';
import styles from './index.css';
import { InviteRow } from './InviteRow';
import { MemberRow } from './MemberRow';
import { messages } from './messages';

/**
 * The page for configuring various settings of an organization.
 */
export function OrganizationSettings(): ReactElement {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { organizations, setOrganizations, userInfo } = useUser();
  const { formatMessage } = useIntl();
  const [icon, setIcon] = useState<File>();

  const {
    data: members,
    error: membersError,
    loading: membersLoading,
    setData: setMembers,
  } = useData<Member[]>(`/api/organizations/${organizationId}/members`);
  const {
    data: invites,
    error: invitesError,
    loading: invitesLoading,
    setData: setInvites,
  } = useData<OrganizationInvite[]>(`/api/organizations/${organizationId}/invites`);
  const addMembersModal = useToggle();
  const editModal = useToggle();

  const onInvited = useCallback(
    (newInvites: OrganizationInvite[]) => setInvites([...invites, ...newInvites]),
    [invites, setInvites],
  );

  const onLogoChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setIcon(e.currentTarget.files[0]);
  }, []);

  const onMemberChanged = useCallback(
    (member: Member) => setMembers(members.map((m) => (m.id === member.id ? member : m))),
    [members, setMembers],
  );

  const onMemberDeleted = useCallback(
    (member: Member) => setMembers(members.filter((m) => m.id !== member.id)),
    [members, setMembers],
  );

  const onInviteDeleted = useCallback(
    (invite: OrganizationInvite) => setInvites(invites.filter((i) => i.email !== invite.email)),
    [invites, setInvites],
  );

  const onEditOrganization = useCallback(
    async ({ name }) => {
      const formData = new FormData();
      formData.set('name', name);

      if (icon) {
        formData.set('icon', icon);
      }

      await axios.patch(`/api/organizations/${organizationId}`, formData);
      setOrganizations(
        organizations.map((org) => (org.id === organizationId ? { ...org, name } : org)),
      );
      editModal.disable();
    },
    [editModal, icon, organizationId, organizations, setOrganizations],
  );

  const organization = organizations.find((org) => org.id === organizationId);
  const me = members?.find((member) => member.id === userInfo.sub);
  const ownerCount = me && members.filter((member) => member.role === 'Owner').length;
  const mayEditOrganization = me && checkRole(me.role, Permission.EditOrganization);
  const mayEdit = me && checkRole(me.role, Permission.ManageMembers);
  const mayInvite = me && checkRole(me.role, Permission.InviteMember);
  const iconUrl = useObjectURL((!editModal.enabled && icon) || organization.iconUrl);
  const editingIconUrl = useObjectURL(icon || organization.iconUrl);

  return (
    <Content fullwidth main padding>
      <div className="is-flex">
        <figure className={`${styles.vertical} image is-128x128`}>
          <img alt={formatMessage(messages.logo)} src={iconUrl} />
        </figure>
        <div className={`${styles.vertical} ml-4 is-inline-block`}>
          <Title level={1}>{organization.name || `@${organizationId}`}</Title>
          {organization.name ? <Subtitle level={3}>{`@${organizationId}`}</Subtitle> : null}
        </div>
        {mayEditOrganization && (
          <Button className={styles.editButton} onClick={editModal.enable}>
            <FormattedMessage {...messages.edit} />
          </Button>
        )}
      </div>

      <hr />
      <HeaderControl
        control={
          <Button onClick={addMembersModal.enable}>
            <FormattedMessage {...messages.addMembers} />
          </Button>
        }
        level={4}
      >
        <FormattedMessage {...messages.members} />
      </HeaderControl>
      {membersLoading || invitesLoading ? (
        <Loader />
      ) : membersError || invitesError ? (
        <Message color="danger">
          <FormattedMessage {...messages.membersError} />
        </Message>
      ) : (
        <Table className={styles.table}>
          <thead>
            <tr>
              <th>
                <FormattedMessage {...messages.name} />
              </th>
              <th align="right">
                <FormattedMessage {...messages.actions} />
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                mayEdit={mayEdit}
                member={member}
                onChanged={onMemberChanged}
                onDeleted={onMemberDeleted}
                ownerCount={ownerCount}
              />
            ))}
            {invites.map((invite) => (
              <InviteRow
                invite={invite}
                key={invite.email}
                mayInvite={mayInvite}
                onDeleted={onInviteDeleted}
              />
            ))}
          </tbody>
        </Table>
      )}
      {mayEditOrganization && (
        <Modal
          component={SimpleForm}
          defaultValues={{
            name: organization.name,
          }}
          footer={
            <>
              <CardFooterButton onClick={editModal.disable}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="primary" type="submit">
                <FormattedMessage {...messages.submit} />
              </CardFooterButton>
            </>
          }
          isActive={editModal.enabled}
          onClose={editModal.disable}
          onSubmit={onEditOrganization}
          title={<FormattedMessage {...messages.edit} />}
        >
          <SimpleFormField
            help={<FormattedMessage {...messages.nameDescription} />}
            label={<FormattedMessage {...messages.name} />}
            maxLength={30}
            minLength={1}
            name="name"
          />
          <FileUpload
            accept="image/jpeg, image/png, image/tiff, image/webp"
            fileButtonLabel={<FormattedMessage {...messages.logo} />}
            fileLabel={<FormattedMessage {...messages.noFile} />}
            help={<FormattedMessage {...messages.logoDescription} />}
            label={<FormattedMessage {...messages.logo} />}
            name="logo"
            onChange={onLogoChange}
            preview={
              <figure className="image is-128x128 mb-2">
                <img
                  alt={formatMessage(messages.logo)}
                  className={styles.icon}
                  src={editingIconUrl}
                />
              </figure>
            }
          />
        </Modal>
      )}
      <AddMembersModal onInvited={onInvited} state={addMembersModal} />
    </Content>
  );
}
