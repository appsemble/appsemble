import PropTypes from 'prop-types';
import React from 'react';
import Helmet from 'react-helmet';

export default class HelmetIntl extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    title: PropTypes.shape().isRequired,
    titleValues: PropTypes.shape(),
  };

  static defaultProps = {
    titleValues: {},
  };

  render() {
    const { title, titleValues, intl } = this.props;

    return <Helmet title={intl.formatMessage(title, titleValues)} />;
  }
}
