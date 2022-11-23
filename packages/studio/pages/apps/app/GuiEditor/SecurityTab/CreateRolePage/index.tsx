import { Button, useMessages } from '@appsemble/react-components';
import { RoleDefinition } from '@appsemble/types';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';

import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';
import { InputTextArea } from '../../Components/InputTextArea/index.js';
import { OptionalList } from '../../Components/OptionalList/index.js';
import { messages } from './messages.js';

export function CreateRolePage(): ReactElement {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();
  const push = useMessages();
  const [createRoleName, setCreateRoleName] = useState<string>('');
  const [createRoleDescription, setCreateRoleDescription] = useState<string>('');
  const [createRoleInherits, setCreateRoleInherits] = useState<string[]>([]);
  const [createRoleDefaultPage, setCreateRoleDefaultPage] = useState<string>(null);

  const onCreateRoleName = useCallback((event: ChangeEvent<HTMLInputElement>, input: string) => {
    setCreateRoleName(input);
  }, []);

  const onCreateRoleDefaultPage = useCallback(
    (pageNr: number) => {
      if (pageNr === 0) {
        setCreateRoleDefaultPage(null);
      } else {
        setCreateRoleDefaultPage(app.definition.pages[pageNr - 1].name);
      }
    },
    [app],
  );

  const onChangeInheritance = useCallback(
    (selectedRoles: string[]) => {
      setCreateRoleInherits([...selectedRoles]);
    },
    [setCreateRoleInherits],
  );

  const onCreateRoleDescription = useCallback((input: string) => {
    setCreateRoleDescription(input);
  }, []);

  const onRoleCreate = useCallback(() => {
    if (!createRoleName || createRoleName.trim() === '') {
      push({ body: formatMessage(messages.roleNameMissing), color: 'danger' });
      return;
    }
    if (app.definition.security?.roles[createRoleName]) {
      push({ body: formatMessage(messages.roleAlreadyExists), color: 'danger' });
      return;
    }
    const newRole: RoleDefinition = {
      ...(createRoleDescription.trim() !== '' && { description: createRoleDescription }),
      ...(createRoleInherits.length > 0 && { inherits: createRoleInherits }),
      ...(createRoleDefaultPage && { defaultPage: createRoleDefaultPage }),
    };
    if (!app.definition.security) {
      app.definition.security = {
        roles: {},
        default: {
          role: createRoleName,
        },
      };
    }
    app.definition.security.roles[createRoleName] = newRole;
    setApp({ ...app });
    push({ body: formatMessage(messages.roleCreated), color: 'success' });
    setCreateRoleDefaultPage(null);
    setCreateRoleDescription('');
    setCreateRoleInherits([]);
    setCreateRoleName('');
  }, [
    app,
    createRoleDefaultPage,
    createRoleDescription,
    createRoleInherits,
    createRoleName,
    formatMessage,
    push,
    setApp,
  ]);

  return (
    <>
      <InputString
        label={formatMessage(messages.roleNameLabel)}
        maxLength={40}
        minLength={1}
        onChange={onCreateRoleName}
        pattern={/[A-z]+[\dA-z]*/}
        value={createRoleName}
      />
      <InputList
        label={formatMessage(messages.defaultPageLabel)}
        labelPosition="top"
        onChange={(pageNr) => onCreateRoleDefaultPage(pageNr)}
        options={[formatMessage(messages.noneLabel)].concat(
          app.definition.pages.map((option) => option.name),
        )}
        value={createRoleDefaultPage || formatMessage(messages.noneLabel)}
      />
      <InputTextArea
        allowSymbols
        label={formatMessage(messages.roleDescriptionLabel)}
        maxLength={80}
        minLength={0}
        onChange={(event, value) => onCreateRoleDescription(value)}
        value={createRoleDescription}
      />
      {Object.entries(app.definition.security?.roles || []).length > 0 && (
        <OptionalList
          addNewItemLabel={formatMessage(messages.addInheritanceLabel)}
          label={formatMessage(messages.inheritsLabel)}
          labelPosition="top"
          onNewSelected={onChangeInheritance}
          options={Object.entries(app.definition.security?.roles || [])
            .map(([key]) => key)
            .filter((role) => !createRoleInherits.includes(role))}
          selected={createRoleInherits}
        />
      )}
      <Button color="primary" onClick={onRoleCreate}>
        {formatMessage(messages.createRoleButton)}
      </Button>
    </>
  );
}
