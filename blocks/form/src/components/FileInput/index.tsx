import { useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FileField, InputProps } from '../../../block';
import { isRequired } from '../../utils/isRequired';
import { FileEntry } from '../FileEntry';
import styles from './index.css';

type FileInputProps = InputProps<string | Blob | (string | Blob)[], FileField>;

export function FileInput({ disabled, error, field, onInput, value }: FileInputProps): VNode {
  const {
    parameters: { optionalLabel },
    utils,
  } = useBlock();
  const { icon, label, name, repeated, tag } = field;
  const required = isRequired(field);
  const remappedLabel = utils.remap(label, value);

  const handleInput = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>, val: string): void => {
      const copy = [].concat(value);
      const index = Number(event.currentTarget.name.split('.').pop());
      if (val == null) {
        copy.splice(index, 1);
      } else {
        copy[index] = val;
      }
      onInput(({ currentTarget: { name } } as unknown) as Event, copy);
    },
    [name, onInput, value],
  );

  return (
    <FormComponent
      className="appsemble-file"
      icon={icon}
      label={remappedLabel}
      optionalLabel={utils.remap(optionalLabel, {})}
      required={required}
      tag={utils.remap(tag, {})}
    >
      {repeated ? (
        <div
          className={classNames('is-flex py-2 px-0', styles.repeatedContainer, {
            'mt-5': !remappedLabel,
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
              error={error}
              field={field}
              // eslint-disable-next-line react/no-array-index-key
              key={index}
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
      {error && <p className="help is-danger">{error}</p>}
    </FormComponent>
  );
}
