import { useBlock } from '@appsemble/preact';
import { Button, Form, FormComponent, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type Choice, type InputProps, type ListField } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';

type ListInputProps = InputProps<string[] | string, ListField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export function ListInput({
  className,
  dirty,
  disabled,
  errorLinkRef,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: ListInputProps): VNode {
  const { events, utils } = useBlock();
  const [loading, setLoading] = useState('event' in field);
  const [options, setOptions] = useState<Choice[]>('event' in field ? [] : field.list);
  const [error, setError] = useState<string>(null);
  const oldOptions = useRef<typeof options>(options);

  const { icon, inline, label, placeholder, tag } = field;
  const value = getValueByNameSequence(name, formValues);
  const required = isRequired(field, utils, formValues);

  const ref = useRef<HTMLFormElement>(null);
  const { disable: hideDropDown, enable: showDropDown, enabled: isDropdownOpen } = useToggle();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (value) {
      setSelected(Array.isArray(value) ? value : [value]);
    }
  }, [value]);

  useEffect(() => {
    if ('list' in field) {
      return;
    }

    const handleOptions = (result: Choice[]): void => {
      setOptions(result);
      setLoading(false);
    };

    const handleError = (): void => {
      setError('Error loading options');
      setLoading(false);
    };

    if ('event' in field && field.event) {
      const eventHandler = (data: Choice[], e: string): void => {
        if (e) {
          handleError();
        } else {
          handleOptions(data);
        }
      };
      events.on[field.event](eventHandler);
      return () => events.off[field.event](eventHandler);
    }
  }, [events, field, utils]);

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
        onChange(event, newSelectedList);
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

        onChange(field.name, newSelectedList);

        return newSelectedList;
      });
    },
    [field.name, onChange],
  );

  useEffect(() => {
    if (oldOptions.current !== options) {
      if (!loading && !value && !options.some((option) => option.value === value)) {
        // Explicitly set value to undefined if value does not exist in the new set of options.
        onChange(field.name);
      }

      oldOptions.current = options;
    }
  }, [field, loading, onChange, options, value]);

  return (
    <FormComponent
      className={classNames(className, styles.field)}
      error={dirty ? error : null}
      help={utils.remap(field.help, value) as string}
      icon={icon}
      id={field.name}
      inline={inline}
      label={(utils.remap(label, value) as string) ?? name}
      name={name}
      required={required}
      tag={tag}
    >
      <Button
        className={classNames(
          'is-fullwidth',
          styles.button,
          icon ? 'is-justify-content-center' : String(styles.noIcon),
          {
            'is-loading': loading,
          },
        )}
        data-field={field.name}
        disabled={disabled || readOnly || loading || !options.length}
        errorLinkRef={errorLinkRef}
        icon="chevron-down"
        iconRight={Boolean(icon)}
        id={field.name}
        onClick={showDropDown}
      >
        {/* Render placeholder text if present, otherwise render hardcoded text and style it if icon is present. */}
        <em>{placeholder || '— Select Options —'}</em>
      </Button>
      {isDropdownOpen ? (
        <Form
          className={classNames(className, styles.dropdown)}
          name={field.name}
          onChange={handleChange}
          onSubmit={(event) => event.preventDefault()}
          ref={ref}
        >
          {options.map(({ label: lab, value: val }) => {
            const valStr = val as string;
            return (
              <div className={styles.option} key={val}>
                <input
                  checked={selected.includes(valStr)}
                  id={valStr.replaceAll(' ', '-')}
                  name={valStr.replaceAll(' ', '-')}
                  type="checkbox"
                  value={valStr}
                />
                <label htmlFor={valStr.replaceAll(' ', '-')}>
                  {(utils.remap(lab, {}) as string) || valStr}
                </label>
              </div>
            );
          })}
        </Form>
      ) : null}
      <div className={styles.chips}>
        {selected.map((val) => {
          const valStr = val as string;
          const item = options.find((listItem) => listItem.value === valStr);
          const lab = item?.label ? (utils.remap(item.label, {}) as string) : val;

          return (
            <div className={styles.chip} key={val}>
              <span>{lab}</span>
              <button
                aria-label={`Remove ${lab}`}
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
    </FormComponent>
  );
}
