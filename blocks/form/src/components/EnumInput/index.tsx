import { useBlock } from '@appsemble/preact';
import { SelectField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { Choice, EnumField, InputProps } from '../../../block';
import { isRequired } from '../../utils/requirements';
import styles from './index.css';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export function EnumInput({ disabled, field, name, onChange, value }: EnumInputProps): VNode {
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
    if ('event' in field) {
      events.on[field.event]((result, e) => {
        if (e) {
          setError(utils.remap(field.loadError ?? 'Error loading options', {}));
        } else {
          setOptions(result as Choice[]);
        }
        setLoading(false);
      });
    }

    if ('action' in field) {
      actions[field.action]
        .dispatch()
        .then((result: Choice[]) => {
          setOptions(result);
          if (!result.map((r) => r.value).includes(value)) {
            // Explicitly set value to undefined if value does not exist in the new set of options.
            // eslint-disable-next-line unicorn/no-useless-undefined
            onChange(field.name, undefined);
          }
          setLoading(false);
        })
        .catch(() => {
          setError(utils.remap(field.loadError ?? 'Error loading options', {}));
          setLoading(false);
        });
    }
  }, [actions, events, field, onChange, utils, value]);

  return (
    <SelectField
      className="appsemble-enum"
      disabled={disabled || loading}
      error={error}
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
      {(!required || !value) && (
        <option className={classNames({ [styles.hidden]: required })} value={null}>
          {utils.remap(placeholder, {}) ?? ''}
        </option>
      )}
      {loading ||
        options.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {utils.remap(choice.label, value) ?? choice.value}
          </option>
        ))}
    </SelectField>
  );
}
