import PropTypes from 'prop-types';
import React from 'react';


/**
 * Render an app page definition.
 */
export default class Page extends React.Component {
  static propTypes = {
    /**
     * The page definition to render
     */
    page: PropTypes.shape().isRequired,
  };

  render() {
    const {
      page,
    } = this.props;

    return (
      page.name
    );
  }
}
