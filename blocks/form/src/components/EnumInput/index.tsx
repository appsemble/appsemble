import { useBlock } from '@appsemble/preact';
import { Option, SelectField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

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
  fieldsetEntryValues,
  formValues,
  name,
  onChange,
  readOnly,
}: EnumInputProps): VNode {
  const { actions, events, utils } = useBlock();
  const [loading, setLoading] = useState('action' in field || 'event' in field);
  const [options, setOptions] = useState(
    'action' in field || 'event' in field
      ? []
      : 'remapper' in field
        ? (utils.remap(field.remapper, { formValues, fieldsetEntryValues }) as Choice[])
        : field.enum,
  );
  const [error, setError] = useState<string>(null);

  const { icon, inline, label, onSelect, placeholder, tag } = field;
  const value = getValueByNameSequence(name, formValues);

  const required = isRequired(field, utils, formValues);

  useEffect(() => {
    if (!loading && value !== undefined && !options.some((option) => option.value === value)) {
      // Explicitly set value to undefined if value does not exist in the new set of options.
      onChange(field.name);
    }
  }, [field, loading, onChange, options, value]);

  useEffect(() => {
    if ('enum' in field) {
      return;
    }

    if ('remapper' in field) {
      setOptions(utils.remap(field.remapper, { formValues, fieldsetEntryValues }) as Choice[]);
      return;
    }

    const handleOptions = (result: Choice[]): void => {
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
  }, [actions, events, field, fieldsetEntryValues, formValues, utils]);

  const handleChange = (n: Event | string, v?: string): void => {
    if (onSelect) {
      actions[onSelect]({ value: v });
    }

    onChange(n, v);
  };

  return (
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
      {loading ||
        options.map((choice) => (
          <Option disabled={choice.disabled} key={choice.value} value={choice.value}>
            {(utils.remap(choice.label, value) as string) ?? (choice.value as string)}
          </Option>
        ))}
    </SelectField>
  );
}
