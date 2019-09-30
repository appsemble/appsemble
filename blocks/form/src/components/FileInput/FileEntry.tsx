/** @jsx h */
import { FormattedMessage } from '@appsemble/preact';
import classNames from 'classnames';
import { Component, Fragment, h, VNode } from 'preact';

import { FileField, InputProps } from '../../../block';
import styles from './FileEntry.css';

interface FileEntryProps extends InputProps<string | Blob, FileField> {
  name: string;
}

interface FileInputState {
  url?: string;
  value?: string | Blob;
}

function getDerivedStateFromProps(
  { value }: FileEntryProps,
  state: FileInputState,
): FileInputState {
  if (value === state.value) {
    return null;
  }
  URL.revokeObjectURL(state.url);
  if (value instanceof Blob) {
    return {
      url: URL.createObjectURL(value),
      value,
    };
  }
  return {
    url: value,
    value,
  };
}

export default class FileEntry extends Component<FileEntryProps> {
  static defaultProps: Partial<FileEntryProps> = {
    value: null,
  };

  state = getDerivedStateFromProps(this.props, {});

  static getDerivedStateFromProps = getDerivedStateFromProps;

  onSelect = async (event: Event): Promise<void> => {
    const {
      onInput,
      field: { maxWidth, maxHeight, quality },
    } = this.props;
    const target = event.target as HTMLInputElement;
    let value: Blob = target.files[0];
    target.value = null;

    if (value && value.type.match('image/*') && (maxWidth || maxHeight || quality)) {
      value = await this.resize(value, maxWidth, maxHeight, quality / 100);
    }

    onInput(({ target } as any) as Event, value);
  };

  resize = async (
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
    await new Promise(resolve => {
      img.onload = resolve;
      img.src = URL.createObjectURL(file);
    });

    let { width, height } = img;

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

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), file.type, quality);
    });
  };

  onRemove = (): void => {
    const { onInput, name } = this.props;

    onInput(({ target: { name } } as any) as Event, null);
  };

  render(): VNode {
    const { field, name } = this.props;
    const { url } = this.state;

    const title = field.label || field.name;

    return (
      <div className={classNames('file', styles.root)}>
        <label className="file-label" htmlFor={field.name}>
          <input
            className={classNames('file-input', styles.input)}
            id={field.name}
            name={name}
            onChange={this.onSelect}
            type="file"
          />
          {url ? (
            <Fragment>
              <figure className={classNames('image', styles.image)}>
                <img alt={title} className={styles.img} src={url} />
              </figure>
              <button
                className={classNames('button', 'is-small', styles.removeButton)}
                onClick={this.onRemove}
                type="button"
              >
                <span className="icon">
                  <i className="fas fa-times" />
                </span>
              </button>
            </Fragment>
          ) : (
            <span className={classNames('image is-128x128', styles.empty)}>
              <span className="file-label">
                <FormattedMessage id="emptyFileLabel" />
              </span>
            </span>
          )}
        </label>
      </div>
    );
  }
}
