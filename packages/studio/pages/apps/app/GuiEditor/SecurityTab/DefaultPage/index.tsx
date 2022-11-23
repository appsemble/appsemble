import { Button } from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';

import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import { messages } from './messages.js';

const policyOptions = ['everyone', 'organization', 'invite'] as const;

export function DefaultPage(): ReactElement {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();

  const onChangeDefaultPolicy = useCallback(
    (index: number) => {
      app.definition.security.default.policy = policyOptions[index];
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeDefaultRole = useCallback(
    (index: number) => {
      app.definition.security.default.role = Object.entries(
        app.definition.security?.roles || [],
      ).map(([key]) => key)[index];
      setApp({ ...app });
    },
    [app, setApp],
  );

  if (!app.definition.security?.roles) {
    return (
      <>
        <p className="help is-danger">{formatMessage(messages.noRoles)}</p>
        <Button className="is-primary" component="a" icon="add">
          <NavLink to="#security/roles">{formatMessage(messages.defaultCreateNewRole)}</NavLink>
        </Button>
      </>
    );
  }

  return (
    <>
      <InputList
        label={formatMessage(messages.defaultRoleLabel)}
        labelPosition="top"
        onChange={onChangeDefaultRole}
        options={Object.entries(app.definition.security.roles || []).map(([key]) => key)}
        value={app.definition.security?.default.role || ''}
      />
      <InputList
        label={formatMessage(messages.defaultPolicyLabel)}
        labelPosition="top"
        onChange={onChangeDefaultPolicy}
        options={policyOptions}
        value={app.definition.security?.default.policy || ''}
      />
    </>
  );
}
