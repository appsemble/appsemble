import { Modal } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import toOData from '../../utils/toOData';
import Field from '../Field';
import styles from './FilterBlock.css';
import messages from './messages';

export default class FilterBlock extends React.Component {
  refreshTimer = null;

  static propTypes = {
    /**
     * The actions as passed by the Appsemble interface.
     */
    actions: PropTypes.shape().isRequired,
    /**
     * The block as passed by the Appsemble interface.
     */
    block: PropTypes.shape().isRequired,
    /**
     * The event helper functions as passed by the Appsemble interface.
     */
    events: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
  };

  state = {
    lastRefreshedDate: undefined,
    newData: [],
    data: [],
    currentFilter: {},
    filter: {},
    loading: false,
    isOpen: false,
  };

  async componentDidMount() {
    const {
      block: {
        parameters: { refreshTimeout },
      },
    } = this.props;

    this.resetFilter();

    if (refreshTimeout) {
      this.refreshTimer = setInterval(this.onRefresh, refreshTimeout * 1000);
    }
  }

  componentWillUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  fetchData = filterParams => {
    const {
      actions,
      block: {
        parameters: { fields },
      },
    } = this.props;

    const { filter } = this.state;

    // Convert date fields to unix timestamps without mutating filter itself
    const convertedFilter = Object.entries(filter).reduce((acc, [key, value]) => {
      const field = fields.find(f => f.name === key);
      if (field.type === 'date') {
        if (field.range) {
          acc[key] = {};
          if (value.to) {
            acc[key].to = new Date(value.to).getTime();
          }

          if (value.from) {
            acc[key].from = new Date(value.from).getTime();
          }
        } else {
          acc[key] = new Date(value).getTime();
        }
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});

    const $filter = toOData(fields, { ...convertedFilter, ...filterParams });

    return actions.load.dispatch({
      ...($filter && { $filter }),
    });
  };

  resetFilter = e => {
    const {
      events,
      block: {
        parameters: { event, fields },
      },
    } = this.props;

    if (e && e.target.disabled) {
      return;
    }

    const defaultFilter = fields.reduce((acc, { name, defaultValue }) => {
      if (defaultValue) {
        acc[name] = defaultValue;
      }
      return acc;
    }, {});

    this.setState({ currentFilter: defaultFilter, filter: defaultFilter }, async () => {
      const data = await this.fetchData();
      events.emit(event, data);
      this.setState({ data, newData: [] });
    });
  };

  onRefresh = async () => {
    const { lastRefreshedDate = new Date(), newData } = this.state;
    const refreshDate = new Date();

    const fetchedItems = await this.fetchData({ created: { from: lastRefreshedDate.getTime() } });

    this.setState({ lastRefreshedDate: refreshDate, newData: [...fetchedItems, ...newData] });
  };

  onDismissRefresh = () => {
    this.setState({ newData: [] });
  };

  onMergeRefresh = () => {
    const { newData, data } = this.state;
    const {
      events,
      block: {
        parameters: { event },
      },
    } = this.props;

    const updatedData = [...newData, ...data];

    events.emit(event, updatedData);
    this.setState({ newData: [], data: updatedData });
  };

  onChange = async ({ target }) => {
    this.setState(({ filter, typingTimer }, { block: { parameters: { fields, highlight } } }) => {
      const newFilter = {
        ...filter,
        [target.name]: target.value,
      };
      if (highlight && target.name === highlight) {
        if (!fields.find(field => field.name === highlight).enum) {
          // wait 300ms, then submit
          clearTimeout(typingTimer);

          return {
            filter: newFilter,
            typingTimer: setTimeout(this.onFilter, 300),
          };
        }
        setTimeout(this.onFilter, 0);
      }
      return { filter: newFilter };
    });
  };

  onRangeChange = ({ target: { id, name, value } }) => {
    this.setState(({ filter }) => {
      const target = id.startsWith('to') ? 'to' : 'from';
      return {
        filter: {
          ...filter,
          [name]: {
            ...filter[name],
            [target]: value,
          },
        },
      };
    });
  };

  onFilter = async () => {
    const {
      block: {
        parameters: { event },
      },
      events,
    } = this.props;

    await this.setState({ loading: true });

    const data = await this.fetchData();
    events.emit(event, data);

    await this.setState(({ filter }) => ({
      loading: false,
      isOpen: false,
      currentFilter: filter,
      data,
      newData: [],
    }));
  };

  onOpen = () => {
    this.setState({ isOpen: true });
  };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { block } = this.props;
    const { currentFilter, filter, isOpen, loading, newData } = this.state;
    const { fields, highlight } = block.parameters;
    const highlightedField = highlight && fields.find(field => field.name === highlight);
    const showModal = !highlightedField || fields.length > 1;

    // check if filter has any field set that isn't already highlighted or its default value
    const activeFilters = Object.entries(currentFilter).some(
      ([key, value]) => !!value || value !== fields.find(field => field.name === key)?.defaultValue,
    );

    return (
      <React.Fragment>
        <div className={styles.container}>
          <Modal isActive={isOpen} onClose={this.onClose}>
            <div className="card">
              <header className="card-header">
                <p className="card-header-title">
                  <FormattedMessage {...messages.filter} />
                </p>
              </header>
              <div className="card-content">
                {fields
                  .filter(field => field.name !== highlight)
                  .map(field => (
                    <Field
                      {...field}
                      key={field.name}
                      filter={filter}
                      loading={loading}
                      onChange={this.onChange}
                      onRangeChange={this.onRangeChange}
                    />
                  ))}
              </div>
              <footer className="card-footer">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                  className="card-footer-item is-link"
                  onClick={this.onClose}
                  onKeyDown={this.onKeyDown}
                  role="button"
                  tabIndex="-1"
                >
                  <FormattedMessage {...messages.cancel} />
                </a>
                <button
                  className={`card-footer-item button is-primary ${styles.cardFooterButton}`}
                  onClick={this.onFilter}
                  type="button"
                >
                  <FormattedMessage {...messages.filter} />
                </button>
              </footer>
            </div>
          </Modal>
          {highlightedField && (
            <div className={styles.highlighted}>
              <Field
                {...highlightedField}
                displayLabel={!!highlightedField.label}
                filter={filter}
                loading={loading}
                onChange={this.onChange}
                onRangeChange={this.onRangeChange}
              />
            </div>
          )}
          {showModal && (
            <React.Fragment>
              <button
                className={classNames('button', styles.filterDialogButton)}
                disabled={!activeFilters}
                onClick={this.resetFilter}
                type="button"
              >
                <span className="icon">
                  <i className="fas fa-ban has-text-danger" />
                </span>
              </button>
              <button
                className={classNames('button', styles.filterDialogButton, {
                  'is-primary': activeFilters,
                })}
                onClick={this.onOpen}
                type="button"
              >
                <span className="icon">
                  <i className="fas fa-filter" />
                </span>
              </button>
            </React.Fragment>
          )}
        </div>
        {newData.length > 0 && (
          <article className={`message ${styles.newDataBar}`}>
            <div className="message-header">
              <button className={styles.newDataButton} onClick={this.onMergeRefresh} type="button">
                <FormattedMessage {...messages.refreshData} values={{ amount: newData.length }} />
              </button>
              <button
                aria-label="delete"
                className="delete"
                onClick={this.onDismissRefresh}
                type="button"
              />
            </div>
          </article>
        )}
      </React.Fragment>
    );
  }
}
