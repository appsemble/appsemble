import {
  Button,
  Content,
  Subtitle,
  Title,
  useObjectURL,
  useToggle,
} from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { useUser } from '../../../../components/UserProvider';
import { checkRole } from '../../../../utils/checkRole';
import { EditOrganizationModal } from './EditOrganizationModal';
import styles from './index.module.css';
import { MemberTable } from './MemberTable';
import { messages } from './messages';

/**
 * The page for configuring various settings of an organization.
 */
export function OrganizationPage(): ReactElement {
  const { organizations, setOrganizations } = useUser();
  const { formatMessage } = useIntl();
  const [icon, setIcon] = useState<File>();
  const {
    params: { organizationId },
  } = useRouteMatch<{ organizationId: string }>();
  const editModal = useToggle();

  const onLogoChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setIcon(e.currentTarget.files[0]);
  }, []);

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
  const mayEditOrganization =
    organization && checkRole(organization.role, Permission.EditOrganization);
  const iconUrl = useObjectURL((!editModal.enabled && icon) || organization.iconUrl);

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
      <MemberTable />
      {mayEditOrganization && (
        <EditOrganizationModal
          editModal={editModal}
          icon={icon}
          onEditOrganization={onEditOrganization}
          onLogoChange={onLogoChange}
          organization={organization}
        />
      )}
    </Content>
  );
}
