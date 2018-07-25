import React from 'react';
import PropTypes from 'prop-types';

import Definition from '../../Definition';


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
    const {
      value,
      ...props
    } = this.props;

    return (
      <Definition {...props}>
        {value}
      </Definition>
    );
  }
}
