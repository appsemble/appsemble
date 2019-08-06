import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { InputProps } from '../../../block';
import styles from './FileEntry.css';
import messages from './messages';

interface FileEntryProps extends InputProps<string | Blob> {
  name: string;
}

interface FileInputState {
  url?: string;
  value?: string | Blob;
}

function getDerivedStateFromProps(
  { value }: FileInputProps,
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

export default class FileEntry extends React.Component<FileEntryProps> {
  static defaultProps: Partial<FileEntryProps> = {
    value: null,
  };

  state = getDerivedStateFromProps(this.props, {});

  static getDerivedStateFromProps = getDerivedStateFromProps;

  inputRef = (node: HTMLInputElement) => {
    if (node == null) {
      return;
    }

    // XXX A native event listener is used, to prevent the same event to be fired twice because of
    // the shadow DOM hackery.
    node.addEventListener('change', async event => {
      const {
        onChange,
        field: { maxWidth, maxHeight, quality },
      } = this.props;
      let value: Blob = (event.target as HTMLInputElement).files[0];
      // eslint-disable-next-line no-param-reassign
      node.value = null;

      if (value && value.type.match('image/*') && (maxWidth || maxHeight || quality)) {
        value = await this.resize(value, maxWidth, maxHeight, quality / 100);
      }

      onChange(event, value);
    });
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

  onRemove = () => {
    const { onChange, name } = this.props;

    onChange({ target: { name } }, null);
  };

  render(): JSX.Element {
    const { field, name } = this.props;
    const { url } = this.state;

    const title = field.label || field.name;

    return (
      <div className={classNames('file', styles.root)}>
        <label className="file-label" htmlFor={field.name}>
          <input
            ref={this.inputRef}
            className={classNames('file-input', styles.input)}
            id={field.name}
            name={name}
            type="file"
          />
          {url ? (
            <React.Fragment>
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
            </React.Fragment>
          ) : (
            <span className={classNames('image is-128x128', styles.empty)}>
              <span className="file-label">
                <FormattedMessage {...messages.clickAction} />
              </span>
            </span>
          )}
        </label>
      </div>
    );
  }
}
