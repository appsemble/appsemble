import { useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';
import { type Dispatch, type StateUpdater, useCallback, useEffect, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type Field, type FileField, type InputProps, type Values } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';
import { FileEntry } from '../FileEntry/index.js';

interface FileInputProps extends InputProps<(Blob | string)[] | Blob | string, FileField> {
  readonly formDataLoading: boolean;

  /**
   * A function to add a thumbnail to the form collected thumbnails
   */
  readonly addThumbnail: (thumbnail: File) => void;

  /**
   * A function to remove a thumbnail from the form collected thumbnails
   */
  readonly removeThumbnail: (thumbnail: File) => void;

  /**
   * A function to update the ready status of the form fields
   */
  readonly setFieldsReady: Dispatch<StateUpdater<Record<Field['name'], boolean>>>;
}

export function FileInput({
  addThumbnail,
  className,
  dirty,
  disabled,
  error,
  errorLinkRef,
  field,
  formDataLoading,
  formValues,
  name,
  onChange,
  removeThumbnail,
  setFieldsReady,
}: FileInputProps): VNode {
  const { utils } = useBlock();
  const { help, inline, label, repeated, tag } = field;
  const value = getValueByNameSequence(name, formValues);
  const required = isRequired(field, utils, formValues);
  const remappedLabel = utils.remap(label, value) ?? name;

  const [fileEntriesReady, setFileEntriesReady] = useState<Record<string, boolean>>({});

  const handleInput = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>, val: string): void => {
      const copy = ([] as unknown[]).concat(value);
      const index = Number(event.currentTarget.name.split('.').pop());
      if (val == null) {
        copy.splice(index, 1);
      } else {
        copy[index] = val;
      }
      onChange(
        { currentTarget: { name } } as unknown as Event,
        copy as (Blob | string)[] | Blob | string,
      );
    },
    [name, onChange, value],
  );

  const handleFileEntryReady = useCallback((entryName: string, ready: boolean): void => {
    setFileEntriesReady((oldFileEntries) => {
      if (oldFileEntries[entryName] !== ready) {
        return {
          ...oldFileEntries,
          [entryName]: ready,
        };
      }
      return oldFileEntries;
    });
  }, []);

  useEffect(() => {
    setFieldsReady((oldFields) => ({
      ...oldFields,
      [name]: !Object.values(fileEntriesReady).includes(false),
    }));
  }, [fileEntriesReady, name, setFieldsReady]);

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
          id={name}
        >
          <div className={styles.repeatedEntries}>
            {(value as string[]).map((val, index) => (
              <FileEntry
                addThumbnail={addThumbnail}
                disabled={disabled}
                error={dirty ? error : null}
                errorLinkRef={errorLinkRef}
                field={field}
                formDataLoading={formDataLoading}
                formValues={val as unknown as Values}
                handleFileEntryReady={handleFileEntryReady}
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                name={`${name}.${index}`}
                onChange={handleInput}
                removeThumbnail={removeThumbnail}
                repeated={repeated}
              />
            ))}
          </div>
          <FileEntry
            addThumbnail={addThumbnail}
            disabled={disabled}
            error={dirty ? error : null}
            errorLinkRef={errorLinkRef}
            field={field}
            formDataLoading={formDataLoading}
            formValues={{}}
            handleFileEntryReady={handleFileEntryReady}
            name={`${name}.${(value as string[]).length}`}
            onChange={handleInput}
            removeThumbnail={removeThumbnail}
            repeated={repeated}
          />
        </div>
      ) : (
        <FileEntry
          addThumbnail={addThumbnail}
          disabled={disabled}
          error={dirty ? error : null}
          errorLinkRef={errorLinkRef}
          field={field}
          formDataLoading={formDataLoading}
          formValues={value as Values}
          handleFileEntryReady={handleFileEntryReady}
          name={name}
          onChange={onChange}
          removeThumbnail={removeThumbnail}
        />
      )}
      {dirty && error ? <p className="help is-danger">{error}</p> : null}
    </FormComponent>
  );
}
