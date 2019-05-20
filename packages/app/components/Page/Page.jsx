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
  };

  constructor(props) {
    super(props);
    this.setupEvents();
  }

  componentDidMount() {
    const { app, getBlockDefs, page } = this.props;

    this.applyBulmaThemes(app, page);
    this.setupEvents();
    getBlockDefs(page.blocks);
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
    if (page !== prevPage) {
      this.applyBulmaThemes(app, page);
      this.teardownEvents();
      this.setupEvents();
      getBlockDefs(page.blocks);
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
            key={`${index}.${counter}`}
            block={block}
            emitEvent={this.emitEvent}
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
