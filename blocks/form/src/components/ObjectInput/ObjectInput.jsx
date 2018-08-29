import PropTypes from 'prop-types';
import React from 'react';

import FieldsetInput from './FieldsetInput';
import GeoCoordinatesInput from './GeoCoordinatesInput';


/**
 * An input element for an object type schema.
 */
export default class ObjectInput extends React.Component {
  static propTypes = {
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
  };

  render() {
    const {
      schema,
    } = this.props;

    switch (schema.title) {
      case 'GeoCoordinates':
        return <GeoCoordinatesInput {...this.props} />;
      default:
        return <FieldsetInput {...this.props} />;
    }
  }
}
