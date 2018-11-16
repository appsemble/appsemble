import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import checkScope from '../../utils/checkScope';
import Block from '../Block';
import Login from '../Login';
import TitleBar from '../TitleBar';
import messages from './messages';
import styles from './Page.css';

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

  state = {
    dialog: null,
    counter: 0,
  };

  componentDidMount() {
    const { getBlockDefs, page } = this.props;

    getBlockDefs(page.blocks.map(({ type }) => type));
  }

  static getDerivedStateFromProps(props, state) {
    if (state.prevPage !== props.page) {
      return { ...state, prevPage: props.page, counter: state.counter + 1 };
    }

    // Nothing to update.
    return null;
  }

  componentDidUpdate({ page: prevPage }) {
    const { getBlockDefs, page } = this.props;
    if (page !== prevPage) {
      getBlockDefs(page.blocks.map(({ type }) => type));
    }
  }

  showDialog = dialog => {
    this.setState({ dialog });
    return () => {
      this.setState({ dialog: null });
    };
  };

  render() {
    const { hasErrors, location, page, user } = this.props;
    const { dialog, counter } = this.state;

    if (!checkScope(page.scope, user)) {
      return (
        <React.Fragment>
          <TitleBar>{page.name}</TitleBar>
          <Login />
        </React.Fragment>
      );
    }

    if (hasErrors) {
      return (
        <p className={styles.error}>
          <FormattedMessage {...messages.error} />
        </p>
      );
    }

    return (
      <React.Fragment>
        <TitleBar>{page.name}</TitleBar>
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
