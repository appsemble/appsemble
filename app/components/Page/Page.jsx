import PropTypes from 'prop-types';
import React from 'react';

import checkScope from '../../utils/checkScope';
import Block from '../Block';
import Login from '../Login';


/**
 * Render an app page definition.
 */
export default class Page extends React.Component {
  static propTypes = {
    getBlockDefs: PropTypes.func.isRequired,
    location: PropTypes.shape().isRequired,
    /**
     * The page definition to render
     */
    page: PropTypes.shape().isRequired,
    user: PropTypes.shape(),
  };

  static defaultProps = {
    user: null,
  };

  componentWillMount() {
    const {
      getBlockDefs,
      page,
    } = this.props;

    getBlockDefs(page.blocks.map(({ type }) => type));
  }

  componentWillReceiveProps({
    page: nextPage,
  }) {
    const {
      getBlockDefs,
      page,
    } = this.props;

    if (page !== nextPage) {
      getBlockDefs(nextPage.blocks.map(({ type }) => type));
    }
  }

  render() {
    const {
      location,
      page,
      user,
    } = this.props;

    if (!checkScope(page.scope, user)) {
      return (
        <Login />
      );
    }

    return page.blocks.map((block, index) => (
      // As long as blocks are in a static list, using the index as a key should be fine.
      // eslint-disable-next-line react/no-array-index-key
      <Block key={`${location.key}.${index}`} block={block} />
    ));
  }
}
