import { NavbarDropdown, NavbarItem } from '@appsemble/react-components';
import { type AppMemberGroup } from '@appsemble/types';
import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { appId } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';

export function GroupDropdown(): ReactNode {
  const { formatMessage } = useIntl();
  const { getAppMessage } = useAppMessages();
  const navigate = useNavigate();
  const { appMemberGroups, appMemberInfo, appMemberSelectedGroup, setAppMemberSelectedGroup } =
    useAppMember();

  const handleGroupChange = (group: AppMemberGroup): void => {
    setAppMemberSelectedGroup(group);
    sessionStorage.setItem(
      `appsemble-group-${appId}-appMemberSelectedGroup`,
      JSON.stringify(group),
    );
    navigate(0);
  };

  return (
    <NavbarDropdown
      className={`is-right ${styles.dropdown}`}
      label={
        <div className="selected flex">
          {appMemberSelectedGroup?.name
            ? `${formatMessage(messages.group)} ${appMemberSelectedGroup?.name}`
            : formatMessage(messages.noGroup)}
          {' - '}
          {appMemberSelectedGroup?.role
            ? getAppMessage({
                id: `app.roles.${appMemberSelectedGroup?.role}`,
                defaultMessage: appMemberSelectedGroup?.role,
              }).format()
            : getAppMessage({
                id: `app.roles.${appMemberInfo.role}`,
                defaultMessage: appMemberInfo.role,
              }).format()}
        </div>
      }
    >
      {appMemberGroups.map((group) => (
        <NavbarItem key={group.id} onClick={() => handleGroupChange(group)}>
          {formatMessage(messages.group)} {group.name}
          {' - '}
          {getAppMessage({
            id: `app.roles.${group.role}`,
            defaultMessage: group.role,
          }).format()}
        </NavbarItem>
      ))}
      <NavbarItem key="no-group" onClick={() => handleGroupChange(null)}>
        {formatMessage(messages.noGroup)}
        {' - '}
        {getAppMessage({
          id: `app.roles.${appMemberInfo.role}`,
          defaultMessage: appMemberInfo.role,
        }).format()}
      </NavbarItem>
    </NavbarDropdown>
  );
}
