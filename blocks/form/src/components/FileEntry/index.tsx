import { useBlock } from '@appsemble/preact';
import { useObjectURL } from '@appsemble/preact-components';
import { Fragment, JSX, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FileField, InputProps } from '../../../block';
import { getAccept } from '../../utils/requirements';
import { resize } from '../../utils/resize';
import styles from './index.module.css';

type FileEntryProps = InputProps<Blob | string, FileField>;

export function FileEntry({ field, name, onChange, value }: FileEntryProps): VNode {
  const url = useObjectURL(value);
  const { utils } = useBlock();

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
      onChange(({ currentTarget: { name } } as any) as Event, null);
    },
    [name, onChange],
  );

  return (
    <div className={`appsemble-file file mr-3 ${styles.root}`}>
      <label className="file-label">
        <input
          accept={getAccept(field)}
          className={`file-input ${styles.input}`}
          name={name}
          onChange={onSelect}
          type="file"
        />
        {url ? (
          <Fragment>
            <figure className="image is-relative">
              <img
                alt={utils.remap(field.label, value) ?? field.name}
                className={styles.image}
                src={url}
              />
            </figure>
            <button
              className={`button is-small ${styles.removeButton}`}
              onClick={onRemove}
              type="button"
            >
              <span className="icon">
                <i className="fas fa-times" />
              </span>
            </button>
          </Fragment>
        ) : (
          <span className={`image is-128x128 px-2 py-2 has-text-centered ${styles.empty}`}>
            <span className="file-label">{utils.remap(field.emptyFileLabel ?? ' ', field)}</span>
          </span>
        )}
      </label>
    </div>
  );
}
