import { Image, Label } from '@appsemble/react-bulma';
import React from 'react';
import PropTypes from 'prop-types';

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
     * The current value.
     */
    value: PropTypes.oneOfType([PropTypes.instanceOf(Blob), PropTypes.string]),
  };

  static defaultProps = {
    value: null,
  };

  render() {
    const { block, field, value } = this.props;

    let src;
    if (value instanceof Blob) {
      src = URL.createObjectURL(value);
    } else if (block?.parameters?.fileBase) {
      src = `${new URL(`${block.parameters.fileBase}/${value}`)}`;
    } else {
      src = value;
    }

    return (
      <React.Fragment>
        {field.label && <Label>{field.label}</Label>}
        <Image
          alt={field.label || field.name}
          className={styles.root}
          imgProps={{
            className: styles.img,
          }}
          src={src}
        />
      </React.Fragment>
    );
  }
}
