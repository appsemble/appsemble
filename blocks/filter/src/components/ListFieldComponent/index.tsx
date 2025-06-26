import { useBlock } from '@appsemble/preact';
import { Button, Form, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type FieldComponentProps, type ListField } from '../../../block.js';

export function ListFieldComponent({
  className,
  field,
  loading,
  onChange,
}: FieldComponentProps<ListField>): VNode {
  const { utils } = useBlock();
  const ref = useRef<HTMLFormElement>(null);
  const { disable: hideDropDown, enable: showDropDown, enabled: isDropdownOpen } = useToggle();
  const [selected, setSelected] = useState<string[]>([]);

  const handleClickAway = useCallback(
    (event: MouseEvent) => {
      const dropdown = ref.current;
      const { height, left, top, width } = dropdown?.getBoundingClientRect() || {};

      if (isDropdownOpen) {
        // If clicked in dropdown area, don't close
        if (
          event.clientX >= left &&
          event.clientX <= left + width &&
          event.clientY >= top &&
          event.clientY <= top + height
        ) {
          return;
        }

        hideDropDown();
      }
    },
    [hideDropDown, isDropdownOpen],
  );

  const removeFilter = useCallback(
    (event: Event & { currentTarget: HTMLButtonElement }) => {
      const { value: val } = event.currentTarget.dataset;

      setSelected((prevSelected) => {
        const newSelectedList = prevSelected.filter((item) => item !== val);
        onChange(event, newSelectedList.join(', '));
        return newSelectedList;
      });
    },
    [onChange],
  );

  useEffect(() => {
    document.addEventListener('click', handleClickAway);
    return () => {
      document.removeEventListener('click', handleClickAway);
    };
  }, [handleClickAway]);

  const handleChange = useCallback(
    (event: Event & { currentTarget: HTMLFormElement }) => {
      const { value: val } = event.target as EventTarget & HTMLInputElement;

      setSelected((prevSelected) => {
        const newSelectedList = prevSelected.includes(val)
          ? prevSelected.filter((selectedValue) => selectedValue !== val)
          : [...prevSelected, val];

        onChange(event, newSelectedList.join(', '));

        return newSelectedList;
      });
    },
    [onChange],
  );

  return (
    <div className={styles.field}>
      <Button
        className={classNames('is-fullwidth', styles.button, { 'is-loading': loading })}
        icon="chevron-down"
        onClick={showDropDown}
      >
        <em>&mdash; Select Option &mdash;</em>
      </Button>
      {isDropdownOpen ? (
        <Form
          className={classNames(className, styles.dropdown)}
          name={field.name}
          onChange={handleChange}
          onSubmit={(event) => event.preventDefault()}
          ref={ref}
        >
          {field.list.map(({ label, value: val }) => {
            const remappedValue = utils.remap(val, {}) as string;
            return (
              <div className={styles.option} key={remappedValue}>
                <input
                  checked={selected.includes(remappedValue)}
                  id={remappedValue.replaceAll(' ', '-')}
                  name={remappedValue.replaceAll(' ', '-')}
                  type="checkbox"
                  value={remappedValue}
                />
                <label htmlFor={remappedValue.replaceAll(' ', '-')}>
                  {(utils.remap(label, {}) as string) || val}
                </label>
              </div>
            );
          })}
        </Form>
      ) : null}
      <div className={styles.chips}>
        {selected.map((val) => {
          const item = field.list.find((listItem) => listItem.value === val);
          const label = item?.label ? (utils.remap(item.label, {}) as string) : val;

          return (
            <div className={styles.chip} key={val}>
              <span>{label}</span>
              <button
                aria-label={`Remove ${label}`}
                className={styles.chip_close}
                data-value={val}
                name={field.name}
                onClick={removeFilter}
                type="button"
              >
                <i className={utils.fa('xmark')} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
