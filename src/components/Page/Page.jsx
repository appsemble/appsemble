import PropTypes from 'prop-types';
import React from 'react';


export default class Page extends React.Component {
  static propTypes = {
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
