import { type BasicPageDefinition } from '@appsemble/lang-sdk';
import {
  Button,
  CardFooterButton,
  Form,
  ModalCard,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { RolesInheritanceList } from './RolesInheritanceList/index.js';
import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';
import { InputTextArea } from '../../Components/InputTextArea/index.js';

interface RolesPageProps {
  readonly selectedRole: string;
}
interface RoleReferences {
  inheritReferences: string[];
  foundInDefaultRole: boolean;
  pageRolesReferences: string[];
  blockRolesReferences: string[];
}

export function RolesPage({ selectedRole }: RolesPageProps): ReactNode {
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

        /* Send API request to server to rename roles from users currently using it */
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

      /* Send API request to server to rename roles from users currently using it */
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
      // Search in default security settings
      const foundInDefaultRole = app.definition.security.default.role === key;
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
        foundInDefaultRole ||
        pageRolesReferences.length > 0 ||
        blockRolesReferences.length > 0
      ) {
        setRoleReferences({
          inheritReferences,
          foundInDefaultRole,
          pageRolesReferences,
          blockRolesReferences,
        });
        modalDeleteRole.enable();
        return;
      }

      /* Send API request to server to delete roles from users currently using it,
      give the user a dropdown to select which
      role to replace it with instead before it deletes */
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
      const { blockRolesReferences, foundInDefaultRole, inheritReferences, pageRolesReferences } =
        roleReferences;
      if (foundInDefaultRole) {
        app.definition.security.default.role = Object.entries(app.definition.security.roles)
          .map(([key]) => key)
          .find((role) => role !== selectedRole);
      }
      if (inheritReferences.length > 0) {
        for (const [roleKey, role] of Object.entries(app.definition.security.roles || [])) {
          if (role.inherits?.includes(selectedRole)) {
            app.definition.security.roles[roleKey].inherits = role.inherits.filter(
              (roleName) => roleName !== selectedRole,
            );
            if (app.definition.security.roles[roleKey].inherits.length === 0) {
              delete app.definition.security.roles[roleKey].inherits;
            }
          }
        }
      }
      if (pageRolesReferences.length > 0) {
        app.definition.pages = app.definition.pages.map((page) => {
          if (page.roles?.includes(selectedRole)) {
            const newPage = { ...page };
            newPage.roles = page.roles.filter((role) => role !== selectedRole);
            if (newPage.roles.length === 0) {
              delete newPage.roles;
            }
            return newPage;
          }
          return page;
        });
      }
      if (blockRolesReferences.length > 0) {
        app.definition.pages = app.definition.pages.map((page) => {
          if (page.type === 'page') {
            const newPage = { ...page };
            newPage.blocks = (page as BasicPageDefinition).blocks.map((block) => {
              if (block.roles?.includes(selectedRole)) {
                const newBlock = { ...block };
                newBlock.roles = block.roles.filter((role) => role !== selectedRole);
                if (newBlock.roles.length === 0) {
                  delete newBlock.roles;
                }
                return newBlock;
              }
              return block;
            });
            return newPage;
          }
          return page;
        });
      }

      /* Send API request to server to delete roles from users currently using it,
      give the user a dropdown to select which
      role to replace it with instead before it deletes. */
      if (Object.entries(app.definition.security?.roles || []).length <= 1) {
        delete app.definition.security;
      } else {
        delete app.definition.security.roles[selectedRole];
      }
      if (foundInDefaultRole) {
        app.definition.security.default.role = Object.entries(app.definition.security.roles)
          .map(([key]) => key)
          .find((role) => role !== selectedRole);
      }
      if (inheritReferences.length > 0) {
        for (const [roleKey, role] of Object.entries(app.definition.security.roles || [])) {
          if (role.inherits?.includes(selectedRole)) {
            app.definition.security.roles[roleKey].inherits = role.inherits.filter(
              (roleName) => roleName !== selectedRole,
            );
            if (app.definition.security.roles[roleKey].inherits.length === 0) {
              delete app.definition.security.roles[roleKey].inherits;
            }
          }
        }
      }
      if (pageRolesReferences.length > 0) {
        app.definition.pages = app.definition.pages.map((page) => {
          if (page.roles?.includes(selectedRole)) {
            const newPage = { ...page };
            newPage.roles = page.roles.filter((role) => role !== selectedRole);
            if (newPage.roles.length === 0) {
              delete newPage.roles;
            }
            return newPage;
          }
          return page;
        });
      }
      if (blockRolesReferences.length > 0) {
        app.definition.pages = app.definition.pages.map((page) => {
          if (page.type === 'page') {
            const newPage = { ...page };
            newPage.blocks = (page as BasicPageDefinition).blocks.map((block) => {
              if (block.roles?.includes(selectedRole)) {
                const newBlock = { ...block };
                newBlock.roles = block.roles.filter((role) => role !== selectedRole);
                if (newBlock.roles.length === 0) {
                  delete newBlock.roles;
                }
                return newBlock;
              }
              return block;
            });
            return newPage;
          }
          return page;
        });
      }

      /* Send API request to server to delete roles from users currently using it,
      give the user a dropdown to select which
      role to replace it with instead before it deletes. */
      if (Object.entries(app.definition.security?.roles || []).length <= 1) {
        delete app.definition.security;
      } else {
        delete app.definition.security.roles[selectedRole];
      }
      if (foundInDefaultRole) {
        app.definition.security.default.role = Object.entries(app.definition.security.roles)
          .map(([key]) => key)
          .find((role) => role !== selectedRole);
      }
      if (inheritReferences.length > 0) {
        for (const [roleKey, role] of Object.entries(app.definition.security.roles || [])) {
          if (role.inherits?.includes(selectedRole)) {
            app.definition.security.roles[roleKey].inherits = role.inherits.filter(
              (roleName) => roleName !== selectedRole,
            );
            if (app.definition.security.roles[roleKey].inherits.length === 0) {
              delete app.definition.security.roles[roleKey].inherits;
            }
          }
        }
      }
      if (pageRolesReferences.length > 0) {
        app.definition.pages = app.definition.pages.map((page) => {
          if (page.roles?.includes(selectedRole)) {
            const newPage = { ...page };
            newPage.roles = page.roles.filter((role) => role !== selectedRole);
            if (newPage.roles.length === 0) {
              delete newPage.roles;
            }
            return newPage;
          }
          return page;
        });
      }
      if (blockRolesReferences.length > 0) {
        app.definition.pages = app.definition.pages.map((page) => {
          if (page.type === 'page') {
            const newPage = { ...page };
            newPage.blocks = (page as BasicPageDefinition).blocks.map((block) => {
              if (block.roles?.includes(selectedRole)) {
                const newBlock = { ...block };
                newBlock.roles = block.roles.filter((role) => role !== selectedRole);
                if (newBlock.roles.length === 0) {
                  delete newBlock.roles;
                }
                return newBlock;
              }
              return block;
            });
            return newPage;
          }
          return page;
        });
      }

      /* Send API request to server to delete roles from users currently using it,
      give the user a dropdown to select which
      role to replace it with instead before it deletes. */
      if (Object.entries(app.definition.security?.roles || []).length <= 1) {
        delete app.definition.security;
      } else {
        delete app.definition.security.roles[selectedRole];
      }
      setApp({ ...app });
      push({ body: formatMessage(messages.roleDeleted, { name: editRoleName }), color: 'success' });
    }
    onCloseDeleteRole();
  }, [
    app,
    editRoleName,
    formatMessage,
    onCloseDeleteRole,
    push,
    roleReferences,
    selectedRole,
    setApp,
  ]);

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
                    {roleReferences?.foundInDefaultRole ? (
                      <p className="is-size-6 has-text-weight-bold has-text-primary">
                        {formatMessage(messages.deleteRoleInDefaultRole, {
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
