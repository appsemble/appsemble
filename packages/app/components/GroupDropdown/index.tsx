import { NavbarDropdown, NavbarItem } from '@appsemble/react-components';
import { type AppMemberGroup } from '@appsemble/types';
import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { appId } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';

export function GroupDropdown(): ReactNode {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { appMemberGroups, appMemberSelectedGroup, setAppMemberSelectedGroup } = useAppMember();

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
        </div>
      }
    >
      {appMemberGroups.map((group) => (
        <NavbarItem key={group.id} onClick={() => handleGroupChange(group)}>
          {formatMessage(messages.group)} {group.name}
        </NavbarItem>
      ))}
      {/* @ts-expect-error 2345 argument of type is not assignable to parameter of type (strictNullChecks) */}
      <NavbarItem key="no-group" onClick={() => handleGroupChange(null)}>
        {formatMessage(messages.noGroup)}
      </NavbarItem>
    </NavbarDropdown>
  );
}
