import {
  Button,
  CardFooterButton,
  Form,
  ModalCard,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { BasicPageDefinition, ResourceCall, ResourceDefinition } from '@appsemble/types';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';
import { InputTextArea } from '../../Components/InputTextArea/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { RolesInheritanceList } from './RolesInheritanceList/index.js';

interface RolesPageProps {
  selectedRole: string;
}
interface RoleReferences {
  inheritReferences: string[];
  foundInTeamsCreate: boolean;
  foundInTeamsInvite: boolean;
  resourceRolesReferences: string[];
  resourceViewsRolesReferences: string[];
  resourceQueryRolesReferences: string[];
  pageRolesReferences: string[];
  blockRolesReferences: string[];
}

export function RolesPage({ selectedRole }: RolesPageProps): ReactElement {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();
  const [editRoleName, setEditRoleName] = useState<string>(null);
  const [newRoleName, setNewRoleName] = useState<string>(null);
  const [roleReferences, setRoleReferences] = useState<RoleReferences>(null);
  const modalDeleteRole = useToggle(false);
  const modalRoleName = useToggle();
  const push = useMessages();

  const onRoleNameChange = useCallback(
    (oldRole: string, newRole: string) => {
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
        if (app.definition.roles) {
          app.definition.roles = app.definition.roles.map((role) =>
            role === oldRole ? newRole : role,
          );
        }
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

  const onRoleDelete = useCallback(
    (key: string) => {
      // Search for any references to this role
      const inheritReferences: string[] = [];
      // Search in roles
      for (const [roleKey, role] of Object.entries(app.definition.security?.roles || [])) {
        if (role.inherits?.includes(key)) {
          inheritReferences.push(roleKey);
        }
      }
      // Search in teams
      const foundInTeamsCreate = app.definition.security.teams?.create?.includes(key);
      const foundInTeamsInvite = app.definition.security.teams?.invite?.includes(key);
      // Search in resources
      const resourceRolesReferences: string[] = [];
      const resourceViewsRolesReferences: string[] = [];
      const resourceQueryRolesReferences: string[] = [];
      for (const [resourceKey, resource] of Object.entries(app.definition.resources || [])) {
        if (resource.roles?.includes(key)) {
          resourceRolesReferences.push(resourceKey);
        }
        for (const [viewKey, view] of Object.entries(resource.views || [])) {
          if (view.roles?.includes(key)) {
            resourceViewsRolesReferences.push(`${resourceKey}.${viewKey}`);
          }
        }
        for (const queryKeys of Object.keys(resource)) {
          if (['create', 'delete', 'get', 'query', 'count', 'update'].includes(queryKeys)) {
            const queryKey = queryKeys as keyof ResourceDefinition;
            const query = resource[queryKey] as ResourceCall;
            if (query.roles?.includes(key)) {
              resourceQueryRolesReferences.push(`${resourceKey}.${queryKey}`);
            }
          }
          if (['create', 'delete', 'update'].includes(queryKeys)) {
            const queryKey = queryKeys as keyof ResourceDefinition;
            const query = resource[queryKey] as ResourceCall;
            if (query.hooks?.notification?.to?.includes(key)) {
              resourceQueryRolesReferences.push(`${resourceKey}.${queryKey}.hooks.notification.to`);
            }
          }
        }
      }
      // Search in pages
      const pageRolesReferences: string[] = [];
      const blockRolesReferences: string[] = [];
      for (const page of app.definition.pages) {
        if (page.roles?.includes(key)) {
          pageRolesReferences.push(page.name);
        }
        // Search in blocks
        if (!page.type || page.type === 'page') {
          for (const block of (page as BasicPageDefinition).blocks) {
            if (block.roles?.includes(key)) {
              blockRolesReferences.push(`${page.name}.${block.type}`);
            }
          }
        }
      }
      if (
        inheritReferences.length > 0 ||
        foundInTeamsCreate ||
        foundInTeamsInvite ||
        resourceRolesReferences.length > 0 ||
        resourceViewsRolesReferences.length > 0 ||
        resourceQueryRolesReferences.length > 0 ||
        pageRolesReferences.length > 0 ||
        blockRolesReferences.length > 0
      ) {
        setRoleReferences({
          inheritReferences,
          foundInTeamsCreate,
          foundInTeamsInvite,
          resourceRolesReferences,
          resourceViewsRolesReferences,
          resourceQueryRolesReferences,
          pageRolesReferences,
          blockRolesReferences,
        });
        modalDeleteRole.enable();
        return;
      }
      delete app.definition.security.roles[key];
      setApp({ ...app });
      push({ body: formatMessage(messages.roleDeleted, { name: key }), color: 'success' });
    },
    [app, formatMessage, modalDeleteRole, push, setApp],
  );

  const onCloseDeleteRole = useCallback(() => {
    modalDeleteRole.disable();
    setRoleReferences(null);
  }, [modalDeleteRole]);

  const onForceDeleteRole = useCallback(() => {
    if (roleReferences) {
      const { foundInTeamsCreate, foundInTeamsInvite, inheritReferences } = roleReferences;
      if (editRoleName) {
        delete app.definition.security.roles[editRoleName];
      }
      // Remove references
      // Remove from roles
      for (const roleKey of inheritReferences) {
        const role = app.definition.security.roles[roleKey];
        if (role.inherits) {
          role.inherits = role.inherits.filter((r) => r !== editRoleName);
        }
      }
      // Remove from teams
      if (foundInTeamsCreate) {
        delete app.definition.security.teams.create;
      }
      if (foundInTeamsInvite) {
        delete app.definition.security.teams.invite;
      }
      setApp({ ...app });
      push({ body: formatMessage(messages.roleDeleted, { name: editRoleName }), color: 'success' });
    }
    onCloseDeleteRole();
  }, [app, editRoleName, formatMessage, onCloseDeleteRole, push, roleReferences, setApp]);

  return (
    <>
      {Object.entries(app.definition.security?.roles || []).map(([key, roleDefinition]) => {
        if (key === selectedRole) {
          return (
            <div key={key}>
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
              <Button className="is-fullwidth" color="danger" onClick={() => onRoleDelete(key)}>
                {formatMessage(messages.deleteRoleButton)}
              </Button>
              <ModalCard
                footer={
                  <>
                    <CardFooterButton onClick={onCloseDeleteRole}>
                      {formatMessage(messages.cancelDeleteRole)}
                    </CardFooterButton>
                    <CardFooterButton color="danger" onClick={onForceDeleteRole}>
                      {formatMessage(messages.forceDeleteRole)}
                    </CardFooterButton>
                  </>
                }
                isActive={modalDeleteRole.enabled}
                onClose={onCloseDeleteRole}
                title={formatMessage(messages.deleteRole)}
                wrapperClassName={styles.card}
              >
                <>
                  <p className="is-size-4">{formatMessage(messages.deleteRoleReferences)}</p>
                  <div className="has-background-grey-lighter">
                    {roleReferences?.inheritReferences?.length > 0 && (
                      <>
                        <p className="is-size-6 has-text-weight-bold">
                          {formatMessage(messages.deleteRoleInherited, { roleName: selectedRole })}
                        </p>
                        {roleReferences.inheritReferences.map((reference) => (
                          <p className="is-size-6 has-text-primary-dark" key={reference}>
                            - {reference}
                          </p>
                        ))}
                      </>
                    )}
                    {roleReferences?.resourceRolesReferences?.length > 0 && (
                      <>
                        <p className="is-size-6 has-text-weight-bold">
                          {formatMessage(messages.deleteRoleResourceRoles, {
                            roleName: selectedRole,
                          })}
                        </p>
                        {roleReferences.resourceRolesReferences.map((reference) => (
                          <p className="is-size-6 has-text-primary-dark" key={reference}>
                            - {reference}
                          </p>
                        ))}
                      </>
                    )}
                    {roleReferences?.resourceViewsRolesReferences?.length > 0 && (
                      <>
                        <p className="is-size-6 has-text-weight-bold">
                          {formatMessage(messages.deleteRoleResourceViews, {
                            roleName: selectedRole,
                          })}
                        </p>
                        {roleReferences.resourceViewsRolesReferences.map((reference) => (
                          <p className="is-size-6 has-text-primary-dark" key={reference}>
                            - {reference}
                          </p>
                        ))}
                      </>
                    )}
                    {roleReferences?.resourceQueryRolesReferences?.length > 0 && (
                      <>
                        <p className="is-size-6 has-text-weight-bold">
                          {formatMessage(messages.deleteRoleResourceQuery, {
                            roleName: selectedRole,
                          })}
                        </p>
                        {roleReferences.resourceQueryRolesReferences.map((reference) => (
                          <p className="is-size-6 has-text-primary-dark" key={reference}>
                            - {reference}
                          </p>
                        ))}
                      </>
                    )}
                    {roleReferences?.pageRolesReferences?.length > 0 && (
                      <>
                        <p className="is-size-6 has-text-weight-bold">
                          {formatMessage(messages.deleteRolePages, { roleName: selectedRole })}
                        </p>
                        {roleReferences.pageRolesReferences.map((reference) => (
                          <p className="is-size-6 has-text-primary-dark" key={reference}>
                            - {reference}
                          </p>
                        ))}
                      </>
                    )}
                    {roleReferences?.blockRolesReferences?.length > 0 && (
                      <>
                        <p className="is-size-6 has-text-weight-bold">
                          {formatMessage(messages.deleteRoleBlocks, { roleName: selectedRole })}
                        </p>
                        {roleReferences.blockRolesReferences.map((reference) => (
                          <p className="is-size-6 has-text-primary-dark" key={reference}>
                            - {reference}
                          </p>
                        ))}
                      </>
                    )}
                    {roleReferences?.foundInTeamsCreate ? (
                      <p className="is-size-6 has-text-weight-bold has-text-primary">
                        {formatMessage(messages.deleteRoleInTeamsCreate, {
                          roleName: selectedRole,
                        })}
                      </p>
                    ) : null}
                    {roleReferences?.foundInTeamsInvite ? (
                      <p className="is-size-6 has-text-weight-bold has-text-primary">
                        {formatMessage(messages.deleteRoleInTeamsInvite, {
                          roleName: selectedRole,
                        })}
                      </p>
                    ) : null}
                  </div>
                  <p className="is-size-4">{formatMessage(messages.deleteRoleWarning)}</p>
                </>
              </ModalCard>
            </div>
          );
        }
      })}
    </>
  );
}
