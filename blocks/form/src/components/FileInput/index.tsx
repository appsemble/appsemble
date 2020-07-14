import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FileField, InputProps } from '../../../block';
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
    [field.name, onInput, value],
  );

  return (
    <FormComponent
      className="appsemble-file"
      iconLeft={field.icon}
      label={field.label}
      required={field.required}
    >
      {field.repeated ? (
        <div
          className={classNames('is-flex py-2 px-0', styles.repeatedContainer, {
            'mt-5': !field.label,
          })}
        >
          <FileEntry
            disabled={disabled}
            error={error}
            field={field}
            name={`${field.name}.${(value as string[]).length}`}
            onInput={handleInput}
            value={null}
          />
          {(value as string[]).map((val, index) => (
            <FileEntry
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              error={error}
              field={field}
              name={`${field.name}.${index}`}
              onInput={handleInput}
              value={val}
            />
          ))}
        </div>
      ) : (
        <FileEntry
          error={error}
          field={field}
          name={field.name}
          onInput={onInput}
          value={value as string}
        />
      )}
    </FormComponent>
  );
}
