import PropTypes from 'prop-types';
import React from 'react';

import DefaultRenderer from './DefaultRenderer';
import GeoCoordinatesInput from './GeoCoordinatesRenderer';

/**
 * An input element for an object type schema.
 */
export default class ObjectRenderer extends React.Component {
  static propTypes = {
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
  };

  render() {
    const { schema } = this.props;

    switch (schema.title) {
      case 'GeoCoordinates':
        return <GeoCoordinatesInput {...this.props} />;
      default:
        return <DefaultRenderer {...this.props} />;
    }
  }
}
