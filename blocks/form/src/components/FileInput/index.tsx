import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FileField, InputProps } from '../../../block';
import isRequired from '../../utils/isRequired';
import FileEntry from '../FileEntry';
import styles from './index.css';

type FileInputProps = InputProps<string | Blob | (string | Blob)[], FileField>;

export default function FileInput({
  disabled,
  error,
  field,
  onInput,
  value,
}: FileInputProps): VNode {
  const { icon, label, name, repeated } = field;
  const required = isRequired(field);

  const handleInput = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>, val: string): void => {
      const copy = [].concat(value);
      const index = Number(event.currentTarget.name.split('.').pop());
      if (val == null) {
        copy.splice(index, 1);
      } else {
        copy[index] = val;
      }
      onInput(({ currentTarget: { name: field.name } } as any) as Event, copy);
    },
    [field, onInput, value],
  );

  return (
    <FormComponent className="appsemble-file" iconLeft={icon} label={label} required={required}>
      {repeated ? (
        <div
          className={classNames('is-flex py-2 px-0', styles.repeatedContainer, {
            'mt-5': !label,
          })}
        >
          <FileEntry
            disabled={disabled}
            error={error}
            field={field}
            name={`${name}.${(value as string[]).length}`}
            onInput={handleInput}
            value={null}
          />
          {(value as string[]).map((val, index) => (
            <FileEntry
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              error={error}
              field={field}
              name={`${name}.${index}`}
              onInput={handleInput}
              value={val}
            />
          ))}
        </div>
      ) : (
        <FileEntry
          error={error}
          field={field}
          name={name}
          onInput={onInput}
          value={value as string}
        />
      )}
    </FormComponent>
  );
}
