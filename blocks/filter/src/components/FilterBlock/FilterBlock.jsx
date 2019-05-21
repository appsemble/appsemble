import { Modal } from '@appsemble/react-components';
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import toOData from '../../utils/toOData';
import Field from '../Field';
import styles from './FilterBlock.css';
import messages from './messages';

export default class FilterBlock extends React.Component {
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
    currentFilter: {},
    filter: {},
    loading: false,
    isOpen: false,
  };

  async componentDidMount() {
    this.resetFilter();
  }

  fetchData = () => {
    const {
      actions,
      block: {
        parameters: { fields },
      },
    } = this.props;
    const { filter } = this.state;

    const filterValue = toOData(fields, filter);

    return actions.load.dispatch({
      ...(filterValue && { $filter: toOData(fields, filter) }),
    });
  };

  resetFilter = () => {
    const {
      events,
      block: {
        parameters: { event, fields },
      },
    } = this.props;

    const defaultFilter = fields.reduce((acc, { name, defaultValue }) => {
      if (defaultValue) {
        acc[name] = defaultValue;
      }
      return acc;
    }, {});

    this.setState({ currentFilter: defaultFilter, filter: defaultFilter }, async () => {
      const data = await this.fetchData();
      events.emit(event, data);
    });
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

    await this.setState(({ filter }) => ({ loading: false, isOpen: false, currentFilter: filter }));
  };

  onOpen = () => {
    this.setState({ isOpen: true });
  };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { block } = this.props;
    const { currentFilter, filter, isOpen, loading } = this.state;
    const { fields, highlight } = block.parameters;
    const highlightedField = highlight && fields.find(field => field.name === highlight);
    const showModal = !highlightedField || fields.length > 1;
    // check if filter has any field set that isn't already highlighted or its default value
    const activeFilters = Object.entries(currentFilter).some(
      ([key, value]) =>
        key !== highlight &&
        (!!value || value !== fields.find(field => field.name === key)?.defaultValue),
    );

    return (
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
              disabled={!activeFilters ? true : undefined}
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
    );
  }
}
