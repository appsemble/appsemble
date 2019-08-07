import { remapData } from '@appsemble/utils';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './FileRenderer.css';

/**
 * Render a string as is.
 */
export default class FileRenderer extends React.Component {
  static propTypes = {
    /**
     * Structure used to define this field.
     */
    field: PropTypes.shape().isRequired,

    /**
     * The parameters passed in by the Appsemble block.
     */
    block: PropTypes.shape().isRequired,

    /**
     * The parameters passed in by the Appsemble block.
     */
    utils: PropTypes.shape().isRequired,

    /**
     * The current value.
     */
    value: PropTypes.oneOfType([
      PropTypes.instanceOf(Blob),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
  };

  static defaultProps = {
    value: null,
  };

  getSrc = value => {
    const { block, utils } = this.props;

    if (value instanceof Blob) {
      const url = URL.createObjectURL(value);
      utils.addCleanup(() => URL.revokeObjectURL(url));
      return url;
    }

    if (block?.parameters?.fileBase) {
      return `${new URL(`${block.parameters.fileBase}/${value}`, window.location.origin)}`;
    }

    return value;
  };

  render() {
    const { field, value } = this.props;

    return (
      <React.Fragment>
        {field.label && <h6 className="title is-6">{field.label}</h6>}
        {field.repeated ? (
          <div className={classNames('container', styles.repeated)}>
            {(value || []).map((v, index) => {
              return (
                <figure
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${field.label || field.name}.${index}`}
                  className={classNames('image', styles.root)}
                >
                  <img
                    alt={field.label || field.name}
                    className={styles.img}
                    src={this.getSrc(field.repeatedName ? remapData(field.repeatedName, v) : v)}
                  />
                </figure>
              );
            })}
          </div>
        ) : (
          <figure className={classNames('image', styles.root)}>
            <img alt={field.label || field.name} className={styles.img} src={this.getSrc(value)} />
          </figure>
        )}
      </React.Fragment>
    );
  }
}
