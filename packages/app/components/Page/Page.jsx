import EventEmitter from 'events';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import checkScope from '../../utils/checkScope';
import Block from '../Block';
import Login from '../Login';
import PageDialog from '../PageDialog';
import TitleBar from '../TitleBar';
import messages from './messages';
import styles from './Page.css';

/**
 * Render an app page definition.
 */
export default class Page extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    getBlockDefs: PropTypes.func.isRequired,
    hasErrors: PropTypes.bool.isRequired,
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
    currentPage: 0,
  };

  flowActions = {
    next: () => {
      const { currentPage } = this.state;
      const { page } = this.props;
      const { flowPages } = page;

      if (currentPage + 1 === flowPages.length) {
        // Trigger flowFinish action
        return;
      }

      this.setState({ currentPage: currentPage + 1 });
    },
    back: () => {
      const { currentPage } = this.state;

      if (currentPage - 1 < 0) {
        // Don't do anything if a previous page does not exist
        return;
      }

      this.setState({ currentPage: currentPage + -1 });
    },
    skip: () => {
      // Trigger flowSkip action
    },
  };

  constructor(props) {
    super(props);
    this.setupEvents();
  }

  componentDidMount() {
    const { app, getBlockDefs, page } = this.props;
    const { currentPage } = this.state;

    this.applyBulmaThemes(app, page);
    this.setupEvents();

    if (page.type === 'flow') {
      getBlockDefs(page.flowPages[currentPage].blocks);
    } else {
      getBlockDefs(page.blocks);
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (state.prevPage !== props.page) {
      return { ...state, prevPage: props.page, counter: state.counter + 1 };
    }

    // Nothing to update.
    return null;
  }

  componentDidUpdate({ page: prevPage }) {
    const { app, getBlockDefs, page } = this.props;
    const { currentPage } = this.state;

    if (page !== prevPage) {
      this.applyBulmaThemes(app, page);
      this.teardownEvents();
      this.setupEvents();

      if (page.type === 'flow') {
        getBlockDefs(page.flowPages[currentPage].blocks);
      } else {
        getBlockDefs(page.blocks);
      }
    }
  }

  componentWillUnmount() {
    this.teardownEvents();
  }

  setupEvents() {
    const ee = new EventEmitter();
    this.emitEvent = (name, data) => ee.emit(name, data);
    this.offEvent = (name, callback) => ee.off(name, callback.bind());
    this.onEvent = (name, callback) => ee.on(name, callback.bind());
    this.ee = ee;
  }

  createBulmaQueryString = () => {
    const { app, page } = this.props;
    const params = { ...app.theme, ...page.theme };
    const queryStringParams = new URLSearchParams(params);
    queryStringParams.sort();

    return queryStringParams.toString();
  };

  applyBulmaThemes = (app, page) => {
    const bulmaStyle = document.getElementById('bulma-style-app');
    const [bulmaUrl] = bulmaStyle.href.split('?');
    bulmaStyle.href =
      app.theme || page.theme ? `${bulmaUrl}?${this.createBulmaQueryString()}` : bulmaUrl;
  };

  showDialog = dialog => {
    this.setState({ dialog });
    return () => {
      this.setState({ dialog: null });
    };
  };

  teardownEvents() {
    if (this.ee) {
      this.ee.removeAllListeners();
      this.ee = null;
      this.emitEvent = null;
      this.offEvent = null;
      this.onEvent = null;
    }
  }

  render() {
    const { hasErrors, page, user } = this.props;
    const { dialog, counter, currentPage } = this.state;
    const { type } = page;

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

    switch (type) {
      case 'flow':
        return (
          <React.Fragment>
            <TitleBar>{page.name}</TitleBar>
            <div className={styles.dotContainer}>
              {page.flowPages.map((sub, index) => (
                <div
                  key={sub.name}
                  className={`${styles.dot} ${index < currentPage && styles.previous} ${index ===
                    currentPage && styles.active}`}
                />
              ))}
            </div>
            {page.flowPages[currentPage].blocks.map((block, index) => (
              <Block
                // As long as blocks are in a static list, using the index as a key should be fine.
                // eslint-disable-next-line react/no-array-index-key
                key={`${currentPage}.${index}.${counter}`}
                block={block}
                emitEvent={this.emitEvent}
                flowActions={this.flowActions}
                offEvent={this.offEvent}
                onEvent={this.onEvent}
                showDialog={this.showDialog}
              />
            ))}
            <PageDialog
              dialog={dialog}
              emitEvent={this.emitEvent}
              offEvent={this.offEvent}
              onEvent={this.onEvent}
            />
          </React.Fragment>
        );
      case 'page':
      default:
        return (
          <React.Fragment>
            <TitleBar>{page.name}</TitleBar>
            {page.blocks.map((block, index) => (
              <Block
                // As long as blocks are in a static list, using the index as a key should be fine.
                // eslint-disable-next-line react/no-array-index-key
                key={`${index}.${counter}`}
                block={block}
                emitEvent={this.emitEvent}
                flowActions={this.flowActions}
                offEvent={this.offEvent}
                onEvent={this.onEvent}
                showDialog={this.showDialog}
              />
            ))}
            <PageDialog
              dialog={dialog}
              emitEvent={this.emitEvent}
              offEvent={this.offEvent}
              onEvent={this.onEvent}
            />
          </React.Fragment>
        );
    }
  }
}
