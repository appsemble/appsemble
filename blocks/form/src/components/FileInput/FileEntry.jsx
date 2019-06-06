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
    node.addEventListener('change', ({ target }) => {
      const { onChange } = this.props;
      const [value] = target.files;
      // eslint-disable-next-line no-param-reassign
      node.value = null;

      onChange({ target }, value);
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
