import { FormattedMessage, useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { JSX, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FileField, InputProps } from '../../../block.js';
import { FileEntry } from '../FileEntry/index.js';
import styles from './index.module.css';

type FileInputProps = InputProps<(Blob | string)[] | Blob | string, FileField>;

export function FileInput({
  className,
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  required,
  value,
}: FileInputProps): VNode {
  const { utils } = useBlock();
  const { icon, label, repeated, tag } = field;
  const remappedLabel = utils.remap(label, value);

  const handleInput = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>, val: string): void => {
      const copy = [].concat(value);
      const index = Number(event.currentTarget.name.split('.').pop());
      if (val == null) {
        copy.splice(index, 1);
      } else {
        copy[index] = val;
      }
      onChange({ currentTarget: { name } } as unknown as Event, copy);
    },
    [name, onChange, value],
  );

  return (
    <FormComponent
      className={classNames('appsemble-file', className)}
      icon={icon}
      label={remappedLabel as string}
      optionalLabel={<FormattedMessage id="optionalLabel" />}
      required={required}
      tag={utils.remap(tag, {}) as string}
    >
      {repeated ? (
        <div
          className={classNames('is-flex py-2 px-0', styles.repeatedContainer, {
            'mt-5': !remappedLabel,
          })}
        >
          <FileEntry
            disabled={disabled}
            error={dirty ? error : null}
            field={field}
            name={`${name}.${(value as string[]).length}`}
            onChange={handleInput}
            value={null}
          />
          {(value as string[]).map((val, index) => (
            <FileEntry
              error={dirty ? error : null}
              field={field}
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              name={`${name}.${index}`}
              onChange={handleInput}
              value={val}
            />
          ))}
        </div>
      ) : (
        <FileEntry
          error={dirty ? error : null}
          field={field}
          name={name}
          onChange={onChange}
          value={value as string}
        />
      )}
      {dirty && error ? <p className="help is-danger">{error}</p> : null}
    </FormComponent>
  );
}
