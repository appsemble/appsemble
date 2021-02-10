import { useBlock } from '@appsemble/preact';
import { Option, SelectField } from '@appsemble/preact-components';
import { VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { Choice, EnumField, InputProps } from '../../../block';
import { isRequired } from '../../utils/requirements';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export function EnumInput({
  dirty,
  disabled,
  field,
  name,
  onChange,
  value,
}: EnumInputProps): VNode {
  const {
    actions,
    events,
    parameters: { optionalLabel },
    utils,
  } = useBlock();
  const [loading, setLoading] = useState('action' in field);
  const [options, setOptions] = useState('action' in field || 'event' in field ? [] : field.enum);
  const [error, setError] = useState<string>(null);

  const { icon, label, placeholder, tag } = field;
  const required = isRequired(field);

  useEffect(() => {
    if (
      value !== undefined &&
      options.length &&
      !options.some((option) => option.value === value)
    ) {
      // Explicitly set value to undefined if value does not exist in the new set of options.
      onChange(field.name);
    }
  }, [field, onChange, options, value]);

  useEffect(() => {
    if ('enum' in field) {
      return;
    }

    const handleOptions = (result: Choice[]): void => {
      setOptions(result);
      setLoading(false);
    };

    const handleError = (): void => {
      setError(utils.remap(field.loadError ?? 'Error loading options', {}));
      setLoading(false);
    };

    if ('action' in field) {
      actions[field.action].dispatch().then(handleOptions, handleError);
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
  }, [actions, events, field, utils]);

  return (
    <SelectField
      className="appsemble-enum"
      disabled={disabled || loading}
      error={dirty && error}
      icon={icon}
      label={utils.remap(label, value)}
      loading={loading}
      name={name}
      onChange={onChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      required={required}
      tag={utils.remap(tag, value)}
      value={value}
    >
      {(!required || value === undefined) && (
        <Option hidden={required} value={null}>
          {utils.remap(placeholder, {}) ?? ''}
        </Option>
      )}
      {loading ||
        options.map((choice) => (
          <Option key={choice.value} value={choice.value}>
            {utils.remap(choice.label, value) ?? choice.value}
          </Option>
        ))}
    </SelectField>
  );
}
