import { Loader } from '@appsemble/react-components';
import EventEmitter from 'events';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import checkScope from '../../utils/checkScope';
import makeActions from '../../utils/makeActions';
import BlockList from '../BlockList';
import FlowPage from '../FlowPage';
import Login from '../Login';
import PageDialog from '../PageDialog';
import TabsPage from '../TabsPage';
import TitleBar from '../TitleBar';
import messages from './messages';
import styles from './Page.css';

/**
 * Render an app page definition.
 */
export default class Page extends React.Component {
  flowActions = {
    next: async data => {
      const { currentPage } = this.state;
      const { page } = this.props;
      const { subPages } = page;

      if (currentPage + 1 === subPages.length) {
        await this.actions.onFlowFinish.dispatch(data);
        return data;
      }

      this.setState({ data, currentPage: currentPage + 1 });
      return data;
    },

    finish: async data => {
      await this.actions.onFlowFinish.dispatch(data);
      this.setState({ data });
      return data;
    },

    back: async data => {
      const { currentPage } = this.state;

      if (currentPage <= 0) {
        // Don't do anything if a previous page does not exist
        return data;
      }

      this.setState({ data, currentPage: currentPage - 1 });
      return data;
    },

    cancel: async data => {
      await this.actions.onFlowCancel.dispatch(data);
      this.setState({ data });
    },
  };

  static propTypes = {
    appId: PropTypes.number.isRequired,
    definition: PropTypes.shape().isRequired,
    getBlockDefs: PropTypes.func.isRequired,
    hasErrors: PropTypes.bool.isRequired,
    history: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    /**
     * The page definition to render
     */
    page: PropTypes.shape().isRequired,
    pending: PropTypes.bool.isRequired,
    user: PropTypes.shape(),
  };

  static defaultProps = {
    user: null,
  };

  state = {
    dialog: null,
    actions: {},
    counter: 0,
    currentPage: 0,
    data: {},
  };

  constructor(props) {
    super(props);
    this.setupEvents();
  }

  componentDidMount() {
    const { appId, definition, getBlockDefs, page, history } = this.props;

    this.applyBulmaThemes(definition, page);
    this.setupEvents();

    if (page.type === 'flow') {
      const actions = makeActions(
        appId,
        { actions: { onFlowFinish: {}, onFlowCancel: {} } },
        definition,
        page,
        history,
        this.showDialog,
        {
          emit: this.emitEvent,
          off: this.offEvent,
          on: this.onEvent,
        },
        {},
        this.flowActions,
      );

      this.actions = actions;
    }

    const blocks = [
      ...(page.type === 'tabs' || page.type === 'flow'
        ? page.subPages.map(f => f.blocks).flat()
        : []),
      ...(!page.type || page.type === 'page' ? page.blocks : []),
    ];

    const actionBlocks = blocks
      .filter(block => block.actions)
      .map(block => {
        return Object.entries(block.actions)
          .filter(([, action]) => action.type === 'dialog')
          .map(([, action]) => action.blocks);
      })
      .flat(2);

    getBlockDefs([...new Set([...blocks, ...actionBlocks])]);
  }

  static getDerivedStateFromProps(props, state) {
    if (state.prevPage !== props.page) {
      return { ...state, prevPage: props.page, counter: state.counter + 1 };
    }

    // Nothing to update.
    return null;
  }

  componentDidUpdate({ page: prevPage }, { prevCurrentPage }) {
    const { definition, getBlockDefs, page } = this.props;
    const { currentPage } = this.state;

    if (page !== prevPage || prevCurrentPage !== currentPage) {
      this.teardownEvents();
      this.setupEvents();

      if (page.type === 'flow' || page.type === 'tabs') {
        getBlockDefs(
          [
            ...new Set(
              page.subPages
                .map(f => f.blocks)
                .flat()
                .map(b => JSON.stringify({ type: b.type, version: b.version })),
            ),
          ].map(block => JSON.parse(block)),
        );
      } else {
        getBlockDefs(page.blocks);
      }

      this.applyBulmaThemes(definition, page);
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
    const { definition, page } = this.props;
    const params = { ...definition.theme, ...page.theme };
    const queryStringParams = new URLSearchParams(params);
    queryStringParams.sort();

    return queryStringParams.toString();
  };

  applyBulmaThemes = (definition, page) => {
    const bulmaStyle = document.getElementById('bulma-style-app');
    const [bulmaUrl] = bulmaStyle.href.split('?');
    bulmaStyle.href =
      definition.theme || page.theme ? `${bulmaUrl}?${this.createBulmaQueryString()}` : bulmaUrl;
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
    const { hasErrors, page, user, pending } = this.props;
    const { dialog, counter, currentPage, data } = this.state;
    const { type } = page;

    if (!checkScope(page.scope, user)) {
      return (
        <>
          <TitleBar>{page.name}</TitleBar>
          <Login />
        </>
      );
    }

    if (hasErrors) {
      return (
        <p className={styles.error}>
          <FormattedMessage {...messages.error} />
        </p>
      );
    }

    if (pending) {
      return <Loader />;
    }

    let component;
    switch (type) {
      case 'flow':
        component = (
          <FlowPage
            blocks={page.subPages[currentPage].blocks}
            counter={counter}
            currentPage={currentPage}
            data={data}
            emitEvent={this.emitEvent}
            flowActions={this.flowActions}
            offEvent={this.offEvent}
            onEvent={this.onEvent}
            showDialog={this.showDialog}
            subPages={page.subPages}
          />
        );
        break;
      case 'tabs':
        component = (
          <TabsPage
            counter={counter}
            data={data}
            emitEvent={this.emitEvent}
            flowActions={this.flowActions}
            offEvent={this.offEvent}
            onEvent={this.onEvent}
            showDialog={this.showDialog}
            subPages={page.subPages}
          />
        );
        break;
      default:
        component = (
          <BlockList
            blocks={page.blocks}
            counter={counter}
            data={data}
            emitEvent={this.emitEvent}
            flowActions={this.flowActions}
            offEvent={this.offEvent}
            onEvent={this.onEvent}
            showDialog={this.showDialog}
          />
        );
    }

    return (
      <>
        <TitleBar>{page.name}</TitleBar>
        {component}
        <PageDialog
          dialog={dialog}
          emitEvent={this.emitEvent}
          offEvent={this.offEvent}
          onEvent={this.onEvent}
        />
      </>
    );
  }
}
