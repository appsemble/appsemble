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

  state = {
    dialog: null,
  };

  componentDidMount() {
    const { getBlockDefs, page } = this.props;

    getBlockDefs(page.blocks.map(({ type }) => type));
  }

  componentDidUpdate({ page: prevPage }) {
    const { getBlockDefs, page } = this.props;

    if (page !== prevPage) {
      getBlockDefs(page.blocks.map(({ type }) => type));
      this.counter = this.counter + 1;
    }
  }

  showDialog = dialog => {
    this.setState({ dialog });
    return () => {
      this.setState({ dialog: null });
    };
  };

  render() {
    const { location, page, user } = this.props;
    const { dialog } = this.state;

    const { counter } = this;

    if (!checkScope(page.scope, user)) {
      return <Login />;
    }

    return (
      <React.Fragment>
        {page.blocks.map((block, index) => (
          <Block
            // As long as blocks are in a static list, using the index as a key should be fine.
            // eslint-disable-next-line react/no-array-index-key
            key={`${location.key}.${index}.${counter}`}
            block={block}
            showDialog={this.showDialog}
          />
        ))}
        {dialog}
      </React.Fragment>
    );
  }
}
