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

  counter = 0;

  static defaultProps = {
    user: null,
  };

  componentDidMount() {
    const {
      getBlockDefs,
      page,
    } = this.props;

    getBlockDefs(page.blocks.map(({ type }) => type));
  }

  componentDidUpdate({
    page: prevPage,
  }) {
    const {
      getBlockDefs,
      page,
    } = this.props;

    if (page !== prevPage) {
      getBlockDefs(page.blocks.map(({ type }) => type));
      this.counter = this.counter + 1;
    }
  }

  render() {
    const {
      location,
      page,
      user,
    } = this.props;

    const { counter } = this;

    if (!checkScope(page.scope, user)) {
      return (
        <Login />
      );
    }

    return page.blocks.map((block, index) => (
      // As long as blocks are in a static list, using the index as a key should be fine.
      // eslint-disable-next-line react/no-array-index-key
      <Block key={`${location.key}.${index}.${counter}`} block={block} />
    ));
  }
}
