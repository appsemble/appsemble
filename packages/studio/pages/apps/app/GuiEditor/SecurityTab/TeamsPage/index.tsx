import { Button } from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';

import { messages } from './messages.js';
import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import { OptionalList } from '../../Components/OptionalList/index.js';
import { type tabChangeOptions } from '../index.js';

const teamsJoinOptions = ['anyone', 'invite'] as const;
const teamsInviteOptions = ['$team:member', '$team:manager'] as const;

interface TeamsPageProps {
  readonly onChangeTab: (tab: (typeof tabChangeOptions)[number]) => void;
}
export function TeamsPage({ onChangeTab }: TeamsPageProps): ReactNode {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();

  const onChangeTeamsJoin = useCallback(
    (index: number) => {
      if (!app.definition.security.teams) {
        app.definition.security.teams = { invite: [], join: 'anyone' };
      }
      app.definition.security.teams.join = teamsJoinOptions[index];
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeTeamsCreate = useCallback(
    (selectedRoles: string[]) => {
      if (!app.definition.security.teams) {
        app.definition.security.teams = { invite: [], join: 'anyone', create: [] };
      }
      if (!app.definition.security.teams.create) {
        app.definition.security.teams.create = [];
      }
      app.definition.security.teams.create = [...selectedRoles];
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeTeamsInvite = useCallback(
    (selectedRoles: string[]) => {
      if (!app.definition.security.teams) {
        app.definition.security.teams = { invite: [], join: 'anyone' };
      }
      app.definition.security.teams.invite = [...selectedRoles];
      setApp({ ...app });
    },
    [app, setApp],
  );

  if (!app.definition.security) {
    return (
      <>
        <p className="help is-danger">{formatMessage(messages.noRoles)}</p>
        <Button
          className="is-primary"
          component="a"
          icon="add"
          onClick={() => onChangeTab('createRole')}
        >
          {formatMessage(messages.createNewRole)}
        </Button>
      </>
    );
  }

  return (
    <>
      <InputList
        label={formatMessage(messages.teamsJoinLabel)}
        labelPosition="top"
        onChange={onChangeTeamsJoin}
        options={teamsJoinOptions}
        value={app.definition.security?.teams?.join || teamsJoinOptions[0]}
      />
      <OptionalList
        addNewItemLabel={formatMessage(messages.teamsAddRole)}
        label={formatMessage(messages.teamsCreateLabel)}
        labelPosition="top"
        onNewSelected={onChangeTeamsCreate}
        options={Object.entries(app.definition.security?.roles || [])
          .map(([key]) => key)
          .filter((role) => !app.definition.security?.teams?.create?.includes(role))}
        selected={app.definition.security?.teams?.create || []}
      />
      <OptionalList
        addNewItemLabel={formatMessage(messages.teamsAddRole)}
        label={formatMessage(messages.teamsInviteLabel)}
        labelPosition="top"
        onNewSelected={onChangeTeamsInvite}
        options={Object.entries(app.definition.security?.roles || [])
          .map(([key]) => key)
          .concat(teamsInviteOptions)
          .filter((role) => !app.definition.security?.teams?.invite?.includes(role))}
        selected={app.definition.security?.teams?.invite || []}
      />
    </>
  );
}
