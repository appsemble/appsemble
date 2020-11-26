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
import classNames from 'classnames';
import React, { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, Redirect, Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';

import { checkRole } from '../../utils/checkRole';
import { useUser } from '../UserProvider';
import { EditOrganizationModal } from './EditOrganizationModal';
import styles from './index.css';
import { MemberTable } from './MemberTable';
import { messages } from './messages';
import { TeamSettings } from './TeamSettings';
import { TeamsList } from './TeamsList';

/**
 * The page for configuring various settings of an organization.
 */
export function OrganizationSettings(): ReactElement {
  const { organizations, setOrganizations } = useUser();
  const { formatMessage } = useIntl();
  const [icon, setIcon] = useState<File>();
  const {
    params: { organizationId },
    path,
    url,
  } = useRouteMatch<{ organizationId: string }>();
  const history = useHistory();
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
      <div className="tabs">
        <ul>
          <li
            className={classNames({ 'is-active': history.location.pathname.endsWith('/members') })}
          >
            <Link to={`${url}/members`}>Members</Link>
          </li>
          <li className={classNames({ 'is-active': history.location.pathname.includes('/teams') })}>
            <Link to={`${url}/teams`}>Teams</Link>
          </li>
        </ul>
      </div>
      <Switch>
        <Route exact path={`${path}/members`}>
          <MemberTable />
        </Route>
        <Route exact path={`${path}/teams`}>
          <TeamsList />
        </Route>
        <Route exact path={`${path}/teams/:teamId`}>
          <TeamSettings />
        </Route>
        <Redirect to={`${path}/members`} />
      </Switch>
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
