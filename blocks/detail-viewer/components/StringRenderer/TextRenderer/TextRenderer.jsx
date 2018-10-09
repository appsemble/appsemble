import React from 'react';
import PropTypes from 'prop-types';

/**
 * Render a string as is.
 */
export default class TextRenderer extends React.Component {
  static propTypes = {
    /**
     * The current value.
     */
    value: PropTypes.string.isRequired,
  };

  render() {
    const { value } = this.props;

    return <p>{value}</p>;
  }
}
