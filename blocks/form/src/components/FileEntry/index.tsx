import { FormattedMessage } from '@appsemble/preact';
import { useObjectURL } from '@appsemble/preact-components';
import { Fragment, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FileField, InputProps } from '../../../block';
import resize from '../../utils/resize';
import styles from './index.css';

interface FileEntryProps extends InputProps<string | Blob, FileField> {
  name: string;
}

export default function FileEntry({
  className,
  field,
  name,
  onInput,
  value,
}: FileEntryProps): VNode {
  const url = useObjectURL(value);

  const onSelect = useCallback(
    async (event: h.JSX.TargetedEvent<HTMLInputElement>): Promise<void> => {
      const { maxHeight, maxWidth, quality } = field;
      const { currentTarget } = event;
      let file: Blob = currentTarget.files[0];
      currentTarget.value = null;

      if (file?.type.match('image/*') && (maxWidth || maxHeight || quality)) {
        file = await resize(file, maxWidth, maxHeight, quality / 100);
      }

      onInput(event, file);
    },
    [field, onInput],
  );

  const onRemove = useCallback(
    (event: Event) => {
      event.preventDefault();
      onInput(({ currentTarget: { name } } as any) as Event, null);
    },
    [name, onInput],
  );

  const title = field.label ?? field.name;

  return (
    <div className={`file mr-3 ${styles.root} ${className}`}>
      <label className="file-label" htmlFor={field.name}>
        <input
          className={`file-input ${styles.input}`}
          id={field.name}
          name={name}
          onChange={onSelect}
          type="file"
        />
        {url ? (
          <Fragment>
            <figure className="image is-relative">
              <img alt={title} className={styles.image} src={url} />
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
            <span className="file-label">
              <FormattedMessage id="emptyFileLabel" />
            </span>
          </span>
        )}
      </label>
    </div>
  );
}
