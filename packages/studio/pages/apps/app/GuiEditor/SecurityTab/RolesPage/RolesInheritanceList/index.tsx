import { Button, useMessages } from '@appsemble/react-components';
import { type ReactElement, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../../../index.js';
import { InputList } from '../../../Components/InputList/index.js';

interface RolesInheritanceListProps {
  readonly label?: string;
  readonly labelPosition?: 'left' | 'top';
  readonly roleKey: string;
}
export function RolesInheritanceList({
  label,
  labelPosition,
  roleKey,
}: RolesInheritanceListProps): ReactElement {
  const [addNewItem, setAddNewItem] = useState(false);
  const push = useMessages();
  const { formatMessage } = useIntl();
  const { app, setApp } = useApp();

  const checkAllowedToInherit = (roleToCheck: string): boolean => {
    const checkInheritance = (role: string): boolean => {
      if (!app.definition.security.roles[role].inherits) {
        return true;
      }
      if (app.definition.security.roles[role].inherits.includes(roleKey)) {
        return false;
      }
      return app.definition.security.roles[role].inherits.every((r) => checkInheritance(r));
    };
    return checkInheritance(roleToCheck);
  };
  const inherits = app.definition.security.roles[roleKey].inherits || [];
  const allowedToInherit = Object.entries(app.definition.security.roles || [])
    .map(([key]) => key)
    .filter((value) => value !== roleKey && checkAllowedToInherit(value));

  const onRoleInheritanceChange = useCallback(
    (index: number, itemOptions: readonly string[], roleChanged: string) => {
      app.definition.security.roles[roleKey].inherits = app.definition.security.roles[
        roleKey
      ].inherits.map((role) => (role === roleChanged ? itemOptions[index] : role));
      setApp({ ...app });
      setAddNewItem(false);
    },
    [app, roleKey, setApp],
  );

  const onRoleInheritanceAdd = useCallback(
    (index: number, itemOptions: readonly string[]) => {
      const newSelected = app.definition.security.roles[roleKey].inherits || [];
      newSelected.push(itemOptions[index]);
      app.definition.security.roles[roleKey].inherits = newSelected;
      setApp({ ...app });
      setAddNewItem(false);
    },
    [app, roleKey, setApp],
  );

  const onInputRemove = useCallback(
    (index: number) => {
      const newSelected = app.definition.security.roles[roleKey].inherits || [];
      newSelected.splice(index, 1);
      app.definition.security.roles[roleKey].inherits = newSelected;
      if (newSelected.length === 0) {
        delete app.definition.security.roles[roleKey].inherits;
      }
      setApp({ ...app });
      setAddNewItem(false);
    },
    [app, roleKey, setApp],
  );

  const onAddNewItem = useCallback(() => {
    if (
      allowedToInherit.filter(
        (value) => !(app.definition.security.roles[roleKey].inherits || []).includes(value),
      ).length === 0
    ) {
      push({
        body: formatMessage(messages.allRolesSelected),
        color: 'warning',
      });
      return;
    }
    setAddNewItem(true);
  }, [allowedToInherit, app.definition.security.roles, formatMessage, push, roleKey]);

  return (
    <div
      className={`${styles.root} field ${
        labelPosition === 'left' ? styles.leftLabel : styles.topLabel
      }`}
    >
      <label className={styles.label}>{label}</label>
      <div className={styles.list}>
        {inherits.map((option, selectedIndex) => (
          <div className={styles.option} key={option}>
            <InputList
              onChange={(index) =>
                onRoleInheritanceChange(
                  index,
                  allowedToInherit.filter((value) => value !== option && !inherits.includes(value)),
                  option,
                )
              }
              options={allowedToInherit.filter(
                (value) => value !== option && !inherits.includes(value),
              )}
              size="large"
              value={option}
            />
            <Button icon="remove" onClick={() => onInputRemove(selectedIndex)} />
          </div>
        ))}
        {addNewItem && allowedToInherit.some((value) => !inherits.includes(value)) ? (
          <div className={styles.option}>
            <InputList
              onChange={(index) =>
                onRoleInheritanceAdd(
                  index,
                  allowedToInherit.filter((value) => !inherits.includes(value)),
                )
              }
              options={allowedToInherit.filter((value) => !inherits.includes(value))}
              value=""
            />
          </div>
        ) : null}
        {addNewItem ? null : (
          <Button
            className={`button ${styles.addNewItem}`}
            icon="add"
            onClick={() => onAddNewItem()}
          >
            {formatMessage(messages.addNewRole)}
          </Button>
        )}
      </div>
    </div>
  );
}
