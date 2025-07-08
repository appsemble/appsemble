import {
  type AppRole,
  type CustomAppPermission,
  getAppPossibleGuestPermissions,
  getAppRoles,
} from '@appsemble/lang-sdk';
import { type ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';

import { messages } from './messages.js';
import { useApp } from '../../../index.js';
import { OptionalList } from '../../Components/OptionalList/index.js';

export function GuestPage(): ReactNode {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();

  const guestInherits = app.definition.security?.guest?.inherits || [];
  const guestPermissions = app.definition.security?.guest?.permissions || [];

  const onChangeInheritance = useCallback(
    (roles: AppRole[]) => {
      app.definition.security.guest.inherits = roles;
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangePermissions = useCallback(
    (permissions: CustomAppPermission[]) => {
      app.definition.security.guest.permissions = permissions;
      setApp({ ...app });
    },
    [app, setApp],
  );

  return (
    <>
      {Object.entries(app.definition.security?.roles || []).length > 0 && (
        <OptionalList
          addNewItemLabel={formatMessage(messages.addInheritanceLabel)}
          label={formatMessage(messages.inheritsLabel)}
          labelPosition="top"
          onNewSelected={onChangeInheritance}
          options={getAppRoles(app.definition.security).filter(
            (role) => !guestInherits.includes(role),
          )}
          selected={guestInherits}
        />
      )}
      <OptionalList
        addNewItemLabel={formatMessage(messages.addPermissionLabel)}
        label={formatMessage(messages.permissionsLabel)}
        labelPosition="top"
        onNewSelected={onChangePermissions}
        options={getAppPossibleGuestPermissions(app.definition).filter(
          (permission) => !guestPermissions.includes(permission),
        )}
        selected={guestPermissions}
      />
    </>
  );
}
