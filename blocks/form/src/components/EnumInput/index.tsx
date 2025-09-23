import { useBlock } from '@appsemble/preact';
import {
  Button,
  InputField,
  Option,
  SelectField,
  useClickOutside,
  useToggle,
} from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type ChangeEvent } from 'preact/compat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { type Choice, type EnumField, type InputProps } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export function EnumInput({
  className,
  dirty,
  disabled,
  errorLinkRef,
  field,
  fieldsetEntryValues = {},
  formValues,
  name,
  onChange,
  readOnly,
}: EnumInputProps): VNode {
  const { actions, events, utils } = useBlock();
  const remapperValues = useMemo(
    () => ({ formValues, fieldsetEntryValues }),
    [formValues, fieldsetEntryValues],
  );

  const [loading, setLoading] = useState('action' in field || 'event' in field);
  const [options, setOptions] = useState(
    'action' in field || 'event' in field
      ? []
      : 'remapper' in field
        ? (utils.remap(field.remapper, remapperValues) as Choice[])
        : field.enum,
  );
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [originalOptions, setOriginalOptions] = useState<Choice[]>(options);
  const [inputValue, setInputValue] = useState<string>('');

  const ref = useRef<HTMLDivElement>();
  const { disable, enabled, toggle } = useToggle();

  const { icon, inline, label, onSelect, placeholder, tag } = field;
  const value = getValueByNameSequence(name, formValues);

  const required = isRequired(field, utils, remapperValues);

  const applyFilter = useCallback((): void => {
    const filteredOptions = originalOptions.filter((choice) =>
      String(choice.label).toLowerCase().includes(filter.toLowerCase()),
    );
    setOptions(filteredOptions);
  }, [filter, originalOptions]);

  useEffect(() => {
    if (!loading && value !== undefined && !options.some((option) => option.value === value)) {
      // Explicitly set value to undefined if value does not exist in the new set of options.
      onChange(field.name);
    }
  }, [field, loading, onChange, options, value]);

  useEffect(() => {
    if ('enum' in field) {
      if ('filter' in field) {
        if (field.filter) {
          applyFilter();
        } else {
          return;
        }
      }
      return;
    }

    if ('remapper' in field) {
      setOptions(utils.remap(field.remapper, remapperValues) as Choice[]);
      if ('filter' in field) {
        if (field.filter) {
          applyFilter();
        } else {
          return;
        }
      }
      return;
    }

    const handleOptions = (result: Choice[]): void => {
      setOriginalOptions(result);
      if ('filter' in field) {
        if (field.filter) {
          applyFilter();
        } else {
          return;
        }
      }
      setLoading(false);
    };

    const handleError = (): void => {
      setError(utils.remap(field.loadError ?? 'Error loading options', {}) as string);
      setLoading(false);
    };

    if ('action' in field) {
      actions[field.action]().then(handleOptions, handleError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if ('enum' in field) {
      return;
    }

    if ('remapper' in field) {
      setOptions(utils.remap(field.remapper, remapperValues) as Choice[]);
      return;
    }

    const handleOptions = (result: Choice[]): void => {
      setOriginalOptions(result);
      setOptions(result);
      setLoading(false);
    };

    const handleError = (): void => {
      setError(utils.remap(field.loadError ?? 'Error loading options', {}) as string);
      setLoading(false);
    };

    if ('action' in field) {
      actions[field.action]().then(handleOptions, handleError);
    }

    if ('event' in field) {
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
  }, [actions, events, field, fieldsetEntryValues, formValues, remapperValues, utils]);

  const filterChange = useCallback((e: ChangeEvent<HTMLInputElement>, input: string): void => {
    setInputValue(input);
    setFilter(input);
  }, []);

  const handleChange = useCallback(
    (n: Event | string, v?: string) => {
      if (onSelect) {
        actions[onSelect]({ value: v });
      }
      onChange(n, v);
    },
    [actions, onChange, onSelect],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        disable();
      }
    },
    [disable],
  );

  const handleSelect = useCallback(
    (choice: Choice) => {
      setInputValue(choice.label as string);
      handleChange(name, choice.value as string);
      disable();
    },
    [disable, handleChange, name],
  );

  // @ts-expect-error strictNullChecks undefined is not assignable
  useClickOutside(ref, disable);

  return (
    <div>
      {field.filter ? (
        <div
          className={classNames('appsemble-enum dropdown is-block', {
            'is-active': enabled,
          })}
          // @ts-expect-error strictNullChecks undefined is not assignable
          ref={ref}
        >
          <InputField
            autocomplete="off"
            className={classNames('field dropdown-trigger', className)}
            disabled={disabled || loading || originalOptions.length === 0}
            errorLinkRef={errorLinkRef}
            help={utils.remap(field.help, value) as string}
            icon={icon}
            label={(utils.remap(label, inputValue) as string) ?? name}
            loading={loading}
            name={name}
            onChange={filterChange}
            onClick={toggle}
            onKeyDown={onKeyDown}
            placeholder={utils.remap(placeholder, {}) as string}
            readOnly={readOnly}
            required={required}
            value={inputValue}
          />
          <div
            className="dropdown-menu"
            id="dropdown-menu"
            onKeyDown={onKeyDown}
            role="menu"
            tabIndex={0}
          >
            <div className="dropdown-content">
              {options.map((choice) => (
                <Button
                  className="dropdown-item"
                  disabled={choice.disabled}
                  key={choice.value}
                  onClick={() => handleSelect(choice)}
                >
                  {(utils.remap(choice.label, value) as string) ?? (choice.value as string)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <SelectField
          className={classNames('appsemble-enum', className)}
          disabled={disabled || loading || options.length === 0}
          error={dirty ? error : null}
          errorLinkRef={errorLinkRef}
          help={utils.remap(field.help, value) as string}
          icon={icon}
          inline={inline}
          label={(utils.remap(label, value) as string) ?? name}
          loading={loading}
          name={name}
          onChange={handleChange}
          optionalLabel={utils.formatMessage('optionalLabel')}
          placeholder={utils.remap(placeholder, {}) as string}
          readOnly={readOnly}
          required={required}
          tag={utils.remap(tag, value) as string}
          value={value}
        >
          {options.map((choice) => (
            <Option disabled={choice.disabled} key={choice.value} value={choice.value}>
              {(utils.remap(choice.label, value) as string) ?? (choice.value as string)}
            </Option>
          ))}
        </SelectField>
      )}
    </div>
  );
}
