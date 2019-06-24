import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './FileEntry.css';
import messages from './messages';

function getDerivedStateFromProps({ value }, state) {
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

export default class FileEntry extends React.Component {
  static propTypes = {
    /**
     * The name of the input field.
     */
    name: PropTypes.string.isRequired,
    /**
     * This will be called when a new file has been selected/
     */
    onChange: PropTypes.func.isRequired,
    /**
     * The enum field to render.
     */
    field: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.oneOfType([PropTypes.instanceOf(Blob), PropTypes.string]),
  };

  static defaultProps = {
    value: null,
  };

  state = getDerivedStateFromProps(this.props, {});

  static getDerivedStateFromProps = getDerivedStateFromProps;

  inputRef = node => {
    if (node == null) {
      return;
    }

    // XXX A native event listener is used, to prevent the same event to be fired twice because of
    // the shadow DOM hackery.
    node.addEventListener('change', async ({ target }) => {
      const {
        onChange,
        field: { maxWidth, maxHeight, quality },
      } = this.props;
      let [value] = target.files;
      // eslint-disable-next-line no-param-reassign
      node.value = null;

      if (value?.type.match('image/*') && (maxWidth || maxHeight || quality)) {
        value = await this.resize(value, maxWidth, maxHeight, quality / 100);
      }

      onChange({ target }, value);
    });
  };

  resize = async (file, maxWidth, maxHeight, quality = 0.8) => {
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

    if (maxWidth || maxHeight) {
      // Resize while respecting ratios.
      if (maxWidth && width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      } else if (maxHeight && height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }
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

  render() {
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
