import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

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
  };

  state = { filter: {} };

  async componentDidMount() {
    const {
      block: {
        parameters: { emit },
      },
      events,
    } = this.props;

    const data = await this.fetchData();
    events.emit(emit, data);
  }

  fetchData = () => {
    const {
      actions,
      block: {
        parameters: { fields },
      },
    } = this.props;
    const { filter } = this.state;
    const params = {
      $filter: Object.keys(filter)
        .map(f => {
          if (!fields.find(field => field.name === f).range) {
            return `substringof('${filter[f]}',${f})`;
          }

          return `(${f} ge ${filter[f].from} and ${f} le ${filter[f].to})`;
        })
        .join(' and'),
    };
    return actions.load.dispatch(params);
  };

  onChange = event => {
    const { filter } = this.state;
    filter[event.target.name] = event.target.value;
    this.setState({ filter });
  };

  onRangeChange = event => {
    const { filter } = this.state;
    const target = event.target.id.startsWith('to') ? 'to' : 'from';
    filter[event.target.name] = { ...filter[event.target.name], [target]: event.target.value };
    this.setState({ filter });
  };

  onFilter = async () => {
    const {
      block: {
        parameters: { emit },
      },
      events,
    } = this.props;

    const data = await this.fetchData();
    events.emit(emit, data);

    this.onClose();
  };

  onOpen = () => {
    this.setState({ isOpen: true });
  };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  generateInput = ({ name, type, range, enum: enumerator, default: defaultValue }) => {
    const { filter } = this.state;

    if (enumerator?.length) {
      return (
        <div className="select">
          <select
            id={`filter${name}`}
            name={name}
            onChange={this.onChange}
            value={filter[name] || defaultValue || ''}
          >
            {!defaultValue && <option />}
            {enumerator.map(({ value, label }, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <option key={index} value={value}>
                {label || value}
              </option>
            ))}
          </select>
        </div>
      );
    }

    switch (type) {
      case 'date': {
        if (!range) {
          return (
            <input
              className="input"
              id={`filter${name}`}
              name={name}
              onChange={this.onChange}
              type="date"
              value={filter[name] || defaultValue || ''}
            />
          );
        }

        return (
          <React.Fragment>
            <input
              className="input"
              id={`filter${name}`}
              max={filter[name]?.to}
              name={name}
              onChange={this.onRangeChange}
              type="date"
              value={filter[name]?.from || defaultValue || ''}
            />
            <input
              className="input"
              id={`to-filter${name}`}
              min={filter[name]?.from}
              name={name}
              onChange={this.onRangeChange}
              type="date"
              value={filter[name]?.to || ''}
            />
          </React.Fragment>
        );
      }
      case 'number': {
        if (!range) {
          return (
            <input
              className="input"
              id={`filter${name}`}
              name={name}
              onChange={this.onChange}
              type="number"
              value={filter[name] || defaultValue || ''}
            />
          );
        }
        return (
          <React.Fragment>
            <input
              className="input"
              id={`filter${name}`}
              max={filter[name]?.to}
              name={name}
              onChange={this.onRangeChange}
              type="number"
              value={filter[name]?.from || defaultValue || ''}
            />
            <input
              className="input"
              id={`to-filter${name}`}
              min={filter[name]?.from}
              name={name}
              onChange={this.onRangeChange}
              type="number"
              value={filter[name]?.to || ''}
            />
          </React.Fragment>
        );
      }
      case 'string':
      default: {
        return (
          <input
            className="input"
            id={`filter${name}`}
            name={name}
            onChange={this.onChange}
            value={filter[name] || defaultValue || ''}
          />
        );
      }
    }
  };

  render() {
    const { block } = this.props;
    const { isOpen } = this.state;
    const { fields } = block.parameters;

    return (
      <React.Fragment>
        <div className={`modal ${isOpen && 'is-active'}`}>
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
                {fields.map(field => {
                  const { name, label = name } = field;

                  return (
                    <div key={name} className="control">
                      <label className="label" htmlFor={`filter${name}`}>
                        {label}
                      </label>
                      {this.generateInput(field)}
                    </div>
                  );
                })}
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
                  className={`card-footer-item button is-info ${styles.cardFooterButton}`}
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

        <button
          className={`button ${styles.filterDialogButton} is-info`}
          onClick={this.onOpen}
          type="button"
        >
          <span className="icon">
            <i className="fas fa-filter" />
          </span>
        </button>
      </React.Fragment>
    );
  }
}
