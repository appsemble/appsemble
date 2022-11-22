import {
  Button,
  CardFooterButton,
  Form,
  ModalCard,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import {
  BasicPageDefinition,
  ResourceCall,
  ResourceDefinition,
  RoleDefinition,
} from '@appsemble/types';
import { ChangeEvent, ReactElement, useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { TreeList } from '../Components/TreeList/index.js';
import { CreateRolePage } from './CreateRolePage/index.js';
import { DefaultPage } from './DefaultPage/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { RolesPage } from './RolesPage/index.js';
import { TeamsPage } from './TeamsPage/index.js';

interface SecurityTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

const Tabs = [
  {
    tab: 'default',
    title: messages.defaultTab,
  },
  {
    tab: 'teams',
    title: messages.teamsTab,
  },
  {
    tab: 'roles',
    title: messages.rolesTab,
  },
] as const;
<<<<<<< HEAD
type LeftSidebar = (typeof Tabs)[number];
export const tabChangeOptions = ['default', 'teams', 'roles', 'createRole'] as const;
=======
type LeftSidebar = typeof Tabs[number];

const policyOptions = ['everyone', 'organization', 'invite'] as const;
const teamsJoinOptions = ['anyone', 'invite'] as const;
>>>>>>> d3d6ae943 (Add create roll and inheritance cycle)

export function SecurityTab({ isOpenLeft, isOpenRight }: SecurityTabProps): ReactElement {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [currentSideBar, setCurrentSideBar] = useState<LeftSidebar>(Tabs[0]);
  const [selectedRole, setSelectedRole] = useState<string>(null);
  const [editRoleName, setEditRoleName] = useState<string>(null);
  const [newRoleName, setNewRoleName] = useState<string>(null);
  const [createRoleName, setCreateRoleName] = useState<string>(null);
  const [createRoleDefinition, setCreateRoleDefinition] = useState<RoleDefinition>(null);
  const modalRoleName = useToggle();
  const push = useMessages();

  const onChangeTab = useCallback(
    (tab: (typeof tabChangeOptions)[number]) => {
      if (tab === 'createRole') {
        setCurrentSideBar(Tabs[2]);
        setSelectedRole(null);
      } else {
        setCurrentSideBar(Tabs.find(({ tab: t }) => t === tab));
      }
    },
    [setCurrentSideBar, setSelectedRole],
  );

  const onChangeTeamsJoin = useCallback(
    (index: number) => {
      if (app.definition.security.teams) {
        app.definition.security.teams.join = teamsJoinOptions[index];
        setApp({ ...app });
      }
    },
    [app, setApp],
  );

  const onRoleSelect = useCallback(
    (index: number) => {
      setSelectedRole(
        Object.entries(app.definition.security?.roles || []).map(([key]) => key)[index],
      );
      setCurrentSideBar(Tabs[2]);
    },
    [app],
  );

  const onRoleNameChange = useCallback(
    (oldRole: string, newRole: string) => {
      setSelectedRole(newRole);
      if (app.definition.security) {
        // Rename role
        for (const [key, value] of Object.entries(app.definition.security.roles || [])) {
          if (key === oldRole) {
            app.definition.security.roles[newRole] = value;
            delete app.definition.security.roles[oldRole];
          }
        }
        // Rename every reference to the role
        // Rename role is roles that view page
        app.definition.roles = app.definition.roles.map((role) =>
          role === oldRole ? newRole : role,
        );
        // Rename role in default policy
        if (app.definition.security.default.role === oldRole) {
          app.definition.security.default.role = newRole;
        }
        // Rename roles in security inheritance
        for (const [roleKey, value] of Object.entries(app.definition.security.roles || [])) {
          if (value.inherits) {
            app.definition.security.roles[roleKey].inherits = value.inherits.map((role) =>
              role === oldRole ? newRole : role,
            );
          }
        }
        // Rename roles in teams
        if (
          app.definition.security.teams?.create &&
          app.definition.security.teams?.create.length > 0
        ) {
          app.definition.security.teams.create = app.definition.security.teams.create.map((role) =>
            role === oldRole ? newRole : role,
          );
        }
        if (
          app.definition.security.teams?.invite &&
          app.definition.security.teams?.invite.length > 0
        ) {
          app.definition.security.teams.invite = app.definition.security.teams.invite.map((role) =>
            role === oldRole ? newRole : role,
          );
        }
        // Rename role in resources
        for (const [key, resource] of Object.entries(app.definition.resources || [])) {
          if (resource.roles?.includes(oldRole)) {
            app.definition.resources[key].roles = resource.roles.map((role) =>
              role === oldRole ? newRole : role,
            );
          }
          for (const [viewKey, view] of Object.entries(resource.views || [])) {
            if (view.roles?.includes(oldRole)) {
              app.definition.resources[key].views[viewKey].roles = view.roles.map((role) =>
                role === oldRole ? newRole : role,
              );
            }
          }
          for (const queryKeys of Object.keys(resource)) {
            if (['create', 'delete', 'get', 'query', 'count', 'update'].includes(queryKeys)) {
              const queryKey = queryKeys as keyof ResourceDefinition;
              const query = resource[queryKey] as ResourceCall;
              if (query.roles?.includes(oldRole)) {
                (app.definition.resources[key][queryKey] as ResourceCall).roles = query.roles.map(
                  (role) => (role === oldRole ? newRole : role),
                );
              }
            }
            if (['create', 'delete', 'update'].includes(queryKeys)) {
              const queryKey = queryKeys as keyof ResourceDefinition;
              const query = resource[queryKey] as ResourceCall;
              if (query.hooks?.notification?.to?.includes(oldRole)) {
                (app.definition.resources[key][queryKey] as ResourceCall).hooks.notification.to =
                  query.hooks.notification.to.map((role) => (role === oldRole ? newRole : role));
              }
            }
          }
        }
        // Rename role in pages
        app.definition.pages.map((page) =>
          page.roles?.includes(oldRole)
            ? page.roles.map((role) => (role === oldRole ? newRole : role))
            : page.roles,
        );
        // Rename roles in blocks
        app.definition.pages.map((page) => {
          if (!page.type || page.type === 'page') {
            return (page as BasicPageDefinition).blocks.map((block) =>
              block.roles?.includes(oldRole)
                ? block.roles.map((role) => (role === oldRole ? newRole : role))
                : block.roles,
            );
          }
          return page;
        });
        setApp({ ...app });
      }
    },
    [app, setApp],
  );

  const onRoleChangeDefaultPage = useCallback(
    (key: string, pageNr: number) => {
      if (app.definition.security?.roles[key]) {
        if (pageNr === 0) {
          delete app.definition.security.roles[key].defaultPage;
        } else {
          app.definition.security.roles[key].defaultPage = app.definition.pages[pageNr - 1].name;
        }
        setApp({ ...app });
      }
    },
    [app, setApp],
  );

  const onRoleDescriptionChange = useCallback(
    (key: string, value: string) => {
      if (app.definition.security?.roles[key]) {
        if (value === '') {
          delete app.definition.security.roles[key].description;
        } else {
          app.definition.security.roles[key].description = value;
        }
        setApp({ ...app });
      }
    },
    [app, setApp],
  );

  const onOpenEditRoleName = useCallback(
    (key: string) => {
      setEditRoleName(key);
      setNewRoleName(key);
      modalRoleName.enable();
    },
    [modalRoleName],
  );

  const closeEditRoleName = useCallback(() => {
    setEditRoleName('');
    modalRoleName.disable();
  }, [modalRoleName]);

  const onNewRoleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: string) => {
      setNewRoleName(value);
    },
    [setNewRoleName],
  );

  const onEditRoleNameSubmit = useCallback(() => {
    if (editRoleName && newRoleName !== '' && editRoleName !== newRoleName) {
      if (
        Object.entries(app.definition.security?.roles || []).some(([key]) => key === newRoleName)
      ) {
        push({ body: formatMessage(messages.roleAlreadyExists), color: 'danger' });
      } else {
        onRoleNameChange(editRoleName, newRoleName);
      }
    }
    closeEditRoleName();
  }, [editRoleName, closeEditRoleName, app, newRoleName, onRoleNameChange, push, formatMessage]);

  const onCreateRoleName = useCallback(
    (event: ChangeEvent<HTMLInputElement>, input: string) => {
      if (input !== '') {
        if (Object.entries(app.definition.security?.roles || []).some(([key]) => key === input)) {
          push({ body: formatMessage(messages.roleAlreadyExists), color: 'danger' });
        } else {
          setCreateRoleName(input);
        }
      }
    },
    [app, push, formatMessage],
  );

  const onCreateRoleDefaultPage = useCallback(
    (pageNr: number) => {
      if (pageNr === 0) {
        delete createRoleDefinition.defaultPage;
      } else {
        createRoleDefinition.defaultPage = app.definition.pages[pageNr - 1].name;
      }
      setCreateRoleDefinition({ ...createRoleDefinition });
    },
    [app, createRoleDefinition, setCreateRoleDefinition],
  );

  const onCreateRoleDescription = useCallback(
    (input: string) => {
      if (input === '') {
        delete createRoleDefinition.description;
      } else {
        createRoleDefinition.description = input;
      }
      setCreateRoleDefinition({ ...createRoleDefinition });
    },
    [createRoleDefinition, setCreateRoleDefinition],
  );

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <>
          {Tabs.map((sidebar) => {
            if (sidebar.tab === 'roles') {
              return (
                <TreeList
                  isSelected={currentSideBar.tab === 'roles'}
                  key={sidebar.tab}
                  label={formatMessage(sidebar.title)}
                  onChange={onRoleSelect}
                  onClick={() => {
                    setCurrentSideBar(sidebar);
                    setSelectedRole('');
                  }}
                  options={Object.entries(app.definition.security?.roles || []).map(([key]) => key)}
                  value={selectedRole}
                />
              );
            }
            return (
              <Button
                className={`${styles.leftBarButton} ${currentSideBar === sidebar ? 'is-link' : ''}`}
                key={sidebar.tab}
                onClick={() => setCurrentSideBar(sidebar)}
              >
                {formatMessage(sidebar.title)}
              </Button>
            );
          })}
        </>
      </Sidebar>
      <div className={styles.root}>
        <Preview app={app} iframeRef={frame} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
<<<<<<< HEAD
        <div className={styles.rightBar}>
          {currentSideBar.tab === 'default' && <DefaultPage onChangeTab={onChangeTab} />}
          {currentSideBar.tab === 'teams' && <TeamsPage onChangeTab={onChangeTab} />}
          {currentSideBar.tab === 'roles' && selectedRole ? (
            <RolesPage selectedRole={selectedRole} />
          ) : null}
          {currentSideBar.tab === 'roles' && !selectedRole ? <CreateRolePage /> : null}
        </div>
=======
        <>
          {currentSideBar.tab === 'default' && (
            <div className={styles.rightBar}>
              <InputList
                label={formatMessage(messages.defaultRoleLabel)}
                labelPosition="top"
                onChange={onChangeDefaultRole}
                options={Object.entries(app.definition.security?.roles || []).map(([key]) => key)}
                value={app.definition.security?.default.role || ''}
              />
              <InputList
                label={formatMessage(messages.defaultPolicyLabel)}
                labelPosition="top"
                onChange={onChangeDefaultPolicy}
                options={policyOptions}
                value={app.definition.security?.default.policy || ''}
              />
              {!app.definition.security?.roles && (
                <>
                  <p className="help is-danger">{formatMessage(messages.noRoles)}</p>
                  <Button
                    className="is-primary"
                    icon="add"
                    onClick={() => {
                      setCurrentSideBar(Tabs[2]);
                      setSelectedRole(null);
                    }}
                  >
                    {formatMessage(messages.defaultCreateNewRole)}
                  </Button>
                </>
              )}
            </div>
          )}
          {currentSideBar.tab === 'teams' && (
            <div className={styles.rightBar}>
              <InputList
                label={formatMessage(messages.teamsJoinLabel)}
                labelPosition="top"
                onChange={onChangeTeamsJoin}
                options={['anyone', 'invite']}
                value={app.definition.security?.teams?.join || 'anyone'}
              />
            </div>
          )}
          {currentSideBar.tab === 'roles' && selectedRole ? (
            <>
              {Object.entries(app.definition.security?.roles || []).map(([key, roleDefinition]) => {
                if (key === selectedRole) {
                  return (
                    <div className={styles.rightBar} key={key}>
                      <InputString
                        label={formatMessage(messages.roleNameLabel)}
                        maxLength={40}
                        minLength={1}
                        onClick={() => onOpenEditRoleName(key)}
                        value={key}
                      />
                      <ModalCard
                        cardClassName={styles.modal}
                        component={Form}
                        footer={
                          <>
                            <CardFooterButton onClick={closeEditRoleName}>
                              <FormattedMessage {...messages.cancelRoleNameButton} />
                            </CardFooterButton>
                            <CardFooterButton color="primary" type="submit">
                              <FormattedMessage {...messages.editRoleNameButton} />
                            </CardFooterButton>
                          </>
                        }
                        isActive={modalRoleName.enabled}
                        onClose={closeEditRoleName}
                        onSubmit={onEditRoleNameSubmit}
                        title={<FormattedMessage {...messages.editNameRoleTitle} />}
                      >
                        <>
                          <p>{formatMessage(messages.editRoleNameDescription)}</p>
                          <br />
                          <InputString
                            allowNumbers
                            allowSpaces={false}
                            allowSymbols
                            label={formatMessage(messages.roleNameLabel)}
                            labelPosition="top"
                            maxLength={40}
                            minLength={1}
                            onChange={onNewRoleNameChange}
                            value={newRoleName}
                          />
                        </>
                      </ModalCard>
                      <InputList
                        key={`${key}defaultPage`}
                        label={formatMessage(messages.defaultPageLabel)}
                        labelPosition="top"
                        onChange={(pageNr) => onRoleChangeDefaultPage(key, pageNr)}
                        options={[formatMessage(messages.noneLabel)].concat(
                          app.definition.pages.map((option) => option.name),
                        )}
                        value={roleDefinition.defaultPage || formatMessage(messages.noneLabel)}
                      />
                      <InputTextArea
                        allowSymbols
                        label={formatMessage(messages.roleDescriptionLabel)}
                        maxLength={80}
                        minLength={0}
                        onChange={(event, value) => onRoleDescriptionChange(key, value)}
                        value={app.definition.security?.roles[key].description || ''}
                      />
                      <RolesInheritanceList
                        label={formatMessage(messages.roleInheritedLabel)}
                        labelPosition="top"
                        roleKey={key}
                      />
                    </div>
                  );
                }
              })}
            </>
          ) : (
            <div className={styles.rightBar}>
              <InputString
                label={formatMessage(messages.roleNameLabel)}
                maxLength={40}
                minLength={1}
                onChange={onCreateRoleName}
                value={createRoleName}
              />
              <InputList
                label={formatMessage(messages.defaultPageLabel)}
                labelPosition="top"
                onChange={(pageNr) => onCreateRoleDefaultPage(pageNr)}
                options={[formatMessage(messages.noneLabel)].concat(
                  app.definition.pages.map((option) => option.name),
                )}
                value={formatMessage(messages.noneLabel)}
              />
              <InputTextArea
                allowSymbols
                label={formatMessage(messages.roleDescriptionLabel)}
                maxLength={80}
                minLength={0}
                onChange={(event, value) => onCreateRoleDescription(value)}
                value=""
              />
            </div>
          )}
        </>
>>>>>>> d3d6ae943 (Add create roll and inheritance cycle)
      </Sidebar>
    </>
  );
}
