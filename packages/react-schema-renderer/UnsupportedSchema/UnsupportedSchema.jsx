import PropTypes from 'prop-types';
import React from 'react';


/**
 * Render a simple string to indicate a schema type is unsupported
 *
 * This uses the renderes provided by the `<SchemaProvider />`.
 */
export default class UnsupportedSchema extends React.Component {
  static propTypes = {
    /**
     * The schema which is not supported
     */
    schema: PropTypes.shape().isRequired,
  };

  render() {
    const {
      schema,
    } = this.props;

    return `Schema type ${schema.type} not supported`;
  }
}
