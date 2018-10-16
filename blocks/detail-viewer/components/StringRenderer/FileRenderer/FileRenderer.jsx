import { Image } from '@appsemble/react-bulma';
import React from 'react';
import PropTypes from 'prop-types';

import styles from './FileRenderer.css';

/**
 * Render a string as is.
 */
export default class FileRenderer extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    name: PropTypes.string.isRequired,
    /**
     * The parameters passed in by the Appsemble block.
     */
    block: PropTypes.shape().isRequired,
    /**
     * The schema of the property to render.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.oneOfType([PropTypes.instanceOf(Blob), PropTypes.string]),
  };

  static defaultProps = {
    value: null,
  };

  render() {
    const { block, name, schema, value } = this.props;

    let src;
    if (value instanceof Blob) {
      src = URL.createObjectURL(value);
    } else if (block?.parameters?.fileBase) {
      src = `${new URL(value, block.parameters.fileBase)}`;
    } else {
      src = value;
    }

    return (
      <Image
        src={src}
        alt={schema.title || name}
        className={styles.root}
        imgProps={{
          className: styles.img,
        }}
      />
    );
  }
}
