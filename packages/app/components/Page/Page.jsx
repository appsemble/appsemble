import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import EventEmitter from 'events';
import throttle from 'lodash.throttle';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect, Route, Switch } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import checkScope from '../../utils/checkScope';
import makeActions from '../../utils/makeActions';
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
    history: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
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
    actions: {},
    counter: 0,
    currentPage: 0,
    data: {},
  };

  flowActions = {
    next: throttle(
      async data => {
        const { currentPage } = this.state;
        const { page } = this.props;
        const { subPages } = page;

        if (currentPage + 1 === subPages.length) {
          this.actions.onFlowFinish.dispatch(data);
          return data;
        }

        this.setState({ data, currentPage: currentPage + 1 });
        return data;
      },
      50,
      { leading: false },
    ),

    finish: throttle(
      async data => {
        this.actions.onFlowFinish.dispatch(data);
        this.setState({ data });
        return data;
      },
      50,
      { leading: false },
    ),

    back: throttle(
      async data => {
        const { currentPage } = this.state;

        if (currentPage <= 0) {
          // Don't do anything if a previous page does not exist
          return data;
        }

        this.setState({ data, currentPage: currentPage - 1 });
        return data;
      },
      50,
      { leading: false },
    ),

    cancel: throttle(
      async data => {
        this.actions.onFlowCancel.dispatch(data);
        this.setState({ data });
      },
      50,
      { leading: false },
    ),
  };

  constructor(props) {
    super(props);
    this.setupEvents();
  }

  componentDidMount() {
    const { app, getBlockDefs, page, history } = this.props;

    this.applyBulmaThemes(app, page);
    this.setupEvents();

    if (page.type === 'tabs' || page.type === 'flow') {
      if (page.type === 'flow') {
        const actions = makeActions(
          { actions: { onFlowFinish: {}, onFlowCancel: {} } },
          app,
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
  }

  static getDerivedStateFromProps(props, state) {
    if (state.prevPage !== props.page) {
      return { ...state, prevPage: props.page, counter: state.counter + 1 };
    }

    // Nothing to update.
    return null;
  }

  componentDidUpdate({ page: prevPage }, { prevCurrentPage }) {
    const { app, getBlockDefs, page } = this.props;
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

      this.applyBulmaThemes(app, page);
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
    const { hasErrors, page, user, match } = this.props;
    const { dialog, counter, currentPage, data } = this.state;
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
              {page.subPages.map((sub, index) => (
                <div
                  key={sub.name}
                  className={`${styles.dot} ${index < currentPage && styles.previous} ${index ===
                    currentPage && styles.active}`}
                />
              ))}
            </div>
            <TransitionGroup className={styles.transitionGroup}>
              {page.subPages[currentPage].blocks.map((block, index) => (
                <CSSTransition
                  // Since blocks are in a static list, using the index as a key should be fine.
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${currentPage}.${index}.${counter}`}
                  classNames={{
                    enter: styles.pageEnter,
                    enterActive: styles.pageEnterActive,
                    exit: styles.pageExit,
                    exitActive: styles.pageExitActive,
                  }}
                  timeout={300}
                >
                  <div className={styles.transitionWrapper}>
                    <Block
                      block={block}
                      className="foo"
                      data={data}
                      emitEvent={this.emitEvent}
                      flowActions={this.flowActions}
                      offEvent={this.offEvent}
                      onEvent={this.onEvent}
                      showDialog={this.showDialog}
                    />
                  </div>
                </CSSTransition>
              ))}
            </TransitionGroup>
            <PageDialog
              dialog={dialog}
              emitEvent={this.emitEvent}
              offEvent={this.offEvent}
              onEvent={this.onEvent}
            />
          </React.Fragment>
        );
      case 'tabs':
        return (
          <React.Fragment>
            <TitleBar>{page.name}</TitleBar>
            <div className="tabs is-centered is-medium">
              <ul>
                {page.subPages.map(({ name }) => (
                  <li
                    key={name}
                    className={classNames({
                      'is-active': normalize(name) === match.params.subPage,
                    })}
                  >
                    <Link to={`${normalize(name)}`}>{name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <Switch>
              {page.subPages.map(({ name, blocks }) => (
                <Route
                  key={name}
                  exact
                  path={`${match.path}/${normalize(name)}`}
                  render={() =>
                    blocks.map((block, index) => (
                      <Block
                        // eslint-disable-next-line react/no-array-index-key
                        key={`${name}.${index}.${counter}`}
                        block={block}
                        className="foo"
                        data={data}
                        emitEvent={this.emitEvent}
                        flowActions={this.flowActions}
                        offEvent={this.offEvent}
                        onEvent={this.onEvent}
                        showDialog={this.showDialog}
                      />
                    ))
                  }
                />
              ))}

              <Redirect to={`${match.url}/${normalize(page.subPages[0].name)}`} />
            </Switch>
          </React.Fragment>
        );
      case 'page':
      case 'subPage':
      default:
        return (
          <React.Fragment>
            {type !== 'subPage' && <TitleBar>{page.name}</TitleBar>}
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
