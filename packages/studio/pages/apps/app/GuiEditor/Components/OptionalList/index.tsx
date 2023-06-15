import { Button } from '@appsemble/react-components';
import { type ReactElement, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { InputList } from '../InputList/index.js';

interface OptionalListProps {
  label?: string;
  labelPosition?: 'left' | 'top';
  addNewItemLabel?: string;
  selected: string[];
  options: readonly string[];
  onNewSelected: (newSelected: string[]) => void;
}
export function OptionalList({
  addNewItemLabel,
  label,
  labelPosition,
  onNewSelected,
  options,
  selected,
}: OptionalListProps): ReactElement {
  const [addNewItem, setAddNewItem] = useState(false);
  const { formatMessage } = useIntl();

  const onItemChange = useCallback(
    (index: number, itemChanged: string) => {
      const newSelected = selected.map((item) => (item === itemChanged ? options[index] : item));
      onNewSelected(newSelected);
      setAddNewItem(false);
    },
    [onNewSelected, options, selected],
  );

  const onItemAdd = useCallback(
    (index: number) => {
      const newSelected = selected || [];
      newSelected.push(options[index]);
      onNewSelected(newSelected);
      setAddNewItem(false);
    },
    [onNewSelected, options, selected],
  );

  const onItemRemove = useCallback(
    (index: number) => {
      const newSelected = [...selected];
      newSelected.splice(index, 1);
      onNewSelected(newSelected);
      setAddNewItem(false);
    },
    [onNewSelected, selected],
  );

  const onToAddItem = useCallback(() => {
    setAddNewItem(true);
  }, []);

  if (!label) {
    return (
      <div className={`${styles.root} field`}>
        <div className={styles.list}>
          {selected.map((option, selectedIndex) => (
            <div className={styles.option} key={option}>
              <InputList
                onChange={(index) => onItemChange(index, option)}
                options={options.filter((value) => value !== option)}
                size="large"
                value={option}
              />
              <Button icon="remove" onClick={() => onItemRemove(selectedIndex)} />
            </div>
          ))}
          {addNewItem && options.length > 0 ? (
            <div className={styles.option}>
              <InputList onChange={onItemAdd} options={options} value="" />
            </div>
          ) : null}
          {!addNewItem && options.length > 0 ? (
            <Button className={`button ${styles.addNewItem}`} icon="add" onClick={onToAddItem}>
              {addNewItemLabel || formatMessage(messages.addNewItem)}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} field ${
        labelPosition === 'left' ? styles.leftLabel : styles.topLabel
      }`}
    >
      <label className={styles.label}>{label}</label>
      <div className={styles.list}>
        {selected.map((option, selectedIndex) => (
          <div className={styles.option} key={option}>
            <InputList
              onChange={(index) => onItemChange(index, option)}
              options={options.filter((value) => value !== option)}
              size="large"
              value={option}
            />
            <Button icon="remove" onClick={() => onItemRemove(selectedIndex)} />
          </div>
        ))}
        {addNewItem && options.length > 0 ? (
          <div className={styles.option}>
            <InputList onChange={onItemAdd} options={options} value="" />
          </div>
        ) : null}
        {!addNewItem && options.length > 0 ? (
          <Button className={`button ${styles.addNewItem}`} icon="add" onClick={onToAddItem}>
            {addNewItemLabel || formatMessage(messages.addNewItem)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
