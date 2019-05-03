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
    filter: {},
    loading: false,
    isOpen: false,
  };

  async componentDidMount() {
    const {
      block: {
        parameters: { event },
      },
      events,
    } = this.props;

    const data = await this.fetchData();
    events.emit(event, data);
  }

  fetchData = () => {
    const {
      actions,
      block: {
        parameters: { fields },
      },
    } = this.props;
    const { filter } = this.state;

    return actions.load.dispatch({
      $filter: toOData(fields, filter),
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

    await this.setState({ loading: false, isOpen: false });
  };

  onOpen = () => {
    this.setState({ isOpen: true });
  };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { block } = this.props;
    const { filter, isOpen, loading } = this.state;
    const { fields, highlight } = block.parameters;
    const highlightedField = highlight && fields.find(field => field.name === highlight);

    return (
      <div className={styles.container}>
        <div className={classNames('modal', { 'is-active': isOpen })}>
          <div
            className="modal-background"
            onClick={this.onClose}
            onKeyDown={this.onKeyDown}
            role="presentation"
          />
          <div className="modal-content">
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
          </div>
          <button className="modal-close is-large" onClick={this.onClose} type="button" />
        </div>
        {highlightedField && (
          <div className={styles.highlighted}>
            <Field
              {...highlightedField}
              filter={filter}
              loading={loading}
              onChange={this.onChange}
              onRangeChange={this.onRangeChange}
            />
          </div>
        )}
        <button
          className={`button ${styles.filterDialogButton}`}
          onClick={this.onOpen}
          type="button"
        >
          <span className="icon">
            <i className="fas fa-filter" />
          </span>
        </button>
      </div>
    );
  }
}
