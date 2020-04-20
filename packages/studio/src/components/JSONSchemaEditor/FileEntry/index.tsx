import classNames from 'classnames';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import styles from './index.css';

interface FileEntryProps {
  url?: string;
  value?: string | Blob;
  prop: OpenAPIV3.SchemaObject;
  disabled?: boolean;
  onInput: (event: Event, val: string | Blob) => void;
  propName: string;
}

export default function FileEntry({
  onInput,
  prop,
  propName,
  url,
  value,
}: FileEntryProps): React.ReactElement {
  const resize = async (
    file: Blob,
    maxWidth: number,
    maxHeight: number,
    quality = 0.8,
  ): Promise<Blob> => {
    // Derived from: https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Attempting to read width/height without waiting for it to load results in the values being 0.
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = URL.createObjectURL(file);
    });

    let { height, width } = img;

    // Resize while respecting ratios.
    if (maxWidth && width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    } else if (maxHeight && height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }

    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);

    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), file.type, quality);
    });
  };

  const onSelect = React.useCallback(
    async (event: React.ChangeEvent): Promise<void> => {
      const target = event.target as HTMLInputElement;
      let fileval: Blob = target.files[0];
      target.value = null;

      if (fileval?.type.match('image/*')) {
        fileval = await resize(fileval, 200, 200, 0.8);
      }

      onInput(({ target } as any) as Event, fileval);
    },
    [onInput],
  );

  const onRemove = React.useCallback((): void => {
    onInput(({ target: { propName } } as any) as Event, null);
  }, [onInput, propName]);

  const title = prop.title ?? propName;

  return (
    <div className={classNames('file', styles.root)}>
      <label className="file-label" htmlFor={propName}>
        <input
          className={classNames('file-input', styles.input)}
          id={propName}
          name={propName}
          onChange={onSelect}
          type="file"
        />
        {url ? (
          <>
            <figure className={classNames('image', styles.image)}>
              <img alt={title} className={styles.img} src={url} />
            </figure>
            <button
              className={classNames('button', 'is-small', styles.removeButton)}
              onClick={onRemove}
              type="button"
            >
              <span className="icon">
                <i className="fas fa-times" />
              </span>
            </button>
          </>
        ) : (
          <span className={classNames('image is-128x128', styles.empty)}>
            <span className="file-label">
              <div id="emptyFileLabel" />
            </span>
          </span>
        )}
      </label>
    </div>
  );
}
