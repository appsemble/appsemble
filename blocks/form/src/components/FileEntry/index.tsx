import { useBlock } from '@appsemble/preact';
import { Modal, useObjectURL, useToggle } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FileField, InputProps } from '../../../block.js';
import { getAccept } from '../../utils/requirements.js';
import { resize } from '../../utils/resize.js';
import styles from './index.module.css';

type FileEntryProps = InputProps<Blob | string, FileField>;

export function FileEntry({ field, name, onChange, value }: FileEntryProps): VNode {
  const url = useObjectURL(value);
  const { utils } = useBlock();
  const modal = useToggle();

  const onSelect = useCallback(
    async (event: JSX.TargetedEvent<HTMLInputElement>): Promise<void> => {
      const { maxHeight, maxWidth, quality } = field;
      const { currentTarget } = event;
      let file = currentTarget.files[0] as Blob;
      currentTarget.value = null;

      if (file?.type.match('image/*') && (maxWidth || maxHeight || quality)) {
        file = await resize(file, maxWidth, maxHeight, quality);
      }

      onChange({ currentTarget, ...event }, file);
    },
    [field, onChange],
  );

  const onRemove = useCallback(
    (event: Event) => {
      event.preventDefault();
      onChange({ currentTarget: { name } } as any as Event, null);
    },
    [name, onChange],
  );

  return (
    <div className={`appsemble-file file mr-3 ${styles.root}`}>
      {value && url ? (
        <Modal isActive={modal.enabled} onClose={modal.disable}>
          <figure className="image">
            <img
              alt={(utils.remap(field.label, value) as string) ?? field.name}
              className={styles.image}
              src={url}
            />
          </figure>
        </Modal>
      ) : null}
      <label className="file-label">
        {!value || !url ? (
          <input
            accept={getAccept(field)}
            className={`file-input ${styles.input}`}
            name={name}
            onChange={onSelect}
            type="file"
          />
        ) : null}
        {url ? (
          <>
            <button className={styles.button} onClick={modal.enable} type="button">
              <figure className="image is-relative">
                <img
                  alt={(utils.remap(field.label, value) as string) ?? field.name}
                  className={`${styles.image} ${styles.rounded}`}
                  src={url}
                />
              </figure>
            </button>
            <button
              className={`button is-small ${styles.removeButton}`}
              onClick={onRemove}
              type="button"
            >
              <span className="icon">
                <i className="fas fa-times" />
              </span>
            </button>
          </>
        ) : (
          <span
            className={`image is-128x128 px-2 py-2 has-text-centered ${styles.rounded} ${styles.empty}`}
          >
            <span className="file-label">
              {utils.remap(field.emptyFileLabel ?? ' ', field) as string}
            </span>
          </span>
        )}
      </label>
    </div>
  );
}
