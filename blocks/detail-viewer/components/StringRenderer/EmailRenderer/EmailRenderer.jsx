import React from 'react';
import PropTypes from 'prop-types';

/**
 * Render an email address as a clickable link.
 */
export default class EmailRenderer extends React.Component {
  static propTypes = {
    /**
     * The current value.
     */
    value: PropTypes.string,
  };

  static defaultProps = {
    value: null,
  };

  render() {
    const { value } = this.props;

    return (
      value && (
        <a href={`mailto:${value}`} rel="noopener noreferrer" target="_blank">
          {value}
        </a>
      )
    );
  }
}
