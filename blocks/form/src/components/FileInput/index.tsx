import { useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type FileField, type InputProps, type Values } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';
import { FileEntry } from '../FileEntry/index.js';

type FileInputProps = InputProps<(Blob | string)[] | Blob | string, FileField>;

export function FileInput({
  className,
  dirty,
  disabled,
  error,
  field,
  formValues,
  name,
  onChange,
}: FileInputProps): VNode {
  const { utils } = useBlock();
  const { help, inline, label, repeated, tag } = field;
  const value = getValueByNameSequence(name, formValues);
  const required = isRequired(field, utils, formValues);
  const remappedLabel = utils.remap(label, value) ?? name;

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
      help={utils.remap(help, {}) as string}
      inline={repeated ? undefined : inline}
      label={remappedLabel as string}
      optionalLabel={utils.formatMessage('optionalLabel')}
      required={required}
      tag={utils.remap(tag, {}) as string}
    >
      {repeated ? (
        <div
          className={classNames('is-flex py-2 pl-2 pr-0', styles.repeatedContainer, {
            'mt-5': !remappedLabel,
          })}
        >
          <FileEntry
            disabled={disabled}
            error={dirty ? error : null}
            field={field}
            formValues={null}
            name={`${name}.${(value as string[]).length}`}
            onChange={handleInput}
            repeated={repeated}
          />
          <div className={styles.repeatedEntries}>
            {(value as string[]).map((val, index) => (
              <FileEntry
                error={dirty ? error : null}
                field={field}
                formValues={val as unknown as Values}
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                name={`${name}.${index}`}
                onChange={handleInput}
                repeated={repeated}
              />
            ))}
          </div>
        </div>
      ) : (
        <FileEntry
          error={dirty ? error : null}
          field={field}
          formValues={value as Values}
          name={name}
          onChange={onChange}
        />
      )}
      {dirty && error ? <p className="help is-danger">{error}</p> : null}
    </FormComponent>
  );
}
