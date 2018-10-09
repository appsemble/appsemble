import { Container } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { SchemaRenderer } from 'react-schema-renderer';

import styles from './ArrayRenderer.css';

/**
 * An input element for an array type schema.
 */
export default class ArrayRenderer extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    name: PropTypes.string,
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.array,
  };

  static defaultProps = {
    name: null,
    value: [],
  };

  render() {
    const { name, schema, value } = this.props;

    return (
      <Container className={styles}>
        {value.map((v, index) => (
          <SchemaRenderer
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            name={name == null ? index : `${name}.${index}`}
            schema={schema.items}
            value={v}
          />
        ))}
      </Container>
    );
  }
}
