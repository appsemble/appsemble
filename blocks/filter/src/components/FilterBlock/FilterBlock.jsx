import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

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

  state = { filter: {} };

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

  onChange = async event => {
    const { filter, typingTimer } = this.state;
    const {
      block: {
        parameters: { fields, highlight },
      },
    } = this.props;

    filter[event.target.name] = event.target.value;
    this.setState({ filter });

    if (highlight && event.target.name === highlight) {
      if (fields.find(field => field.name === highlight).enum?.length) {
        await this.onFilter();
      } else {
        // wait 300ms, then submit
        clearTimeout(typingTimer);

        this.setState({
          typingTimer: setTimeout(async () => {
            await this.onFilter();
          }, 300),
        });
      }
    }
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

  generateField = ({
    name,
    label = name,
    type,
    range,
    enum: enumerator,
    default: defaultValue,
  }) => {
    const {
      intl: { formatMessage },
    } = this.props;
    const { filter, loading } = this.state;
    const labelElement = (
      <label className="label" htmlFor={`filter${name}`}>
        {label}
      </label>
    );

    let control;

    if (enumerator?.length) {
      control = (
        <div className="select is-fullwidth">
          <select
            id={`filter${name}`}
            name={name}
            onChange={this.onChange}
            value={filter[name] || defaultValue || ''}
          >
            {!defaultValue && <option />}
            {enumerator.map(({ value, label: lbl }, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <option key={index} value={value}>
                {lbl || value}
              </option>
            ))}
          </select>
        </div>
      );
    } else {
      switch (type) {
        case 'date': {
          if (!range) {
            control = (
              <input
                className="input"
                id={`filter${name}`}
                name={name}
                onChange={this.onChange}
                type="date"
                value={filter[name] || defaultValue || ''}
              />
            );
            break;
          }

          control = (
            <React.Fragment>
              <p className={classNames('control', { 'is-loading': loading })}>
                <input
                  className="input"
                  id={`filter${name}`}
                  max={filter[name]?.to}
                  name={name}
                  onChange={this.onRangeChange}
                  placeholder={formatMessage(messages.from)}
                  type="date"
                  value={filter[name]?.from || defaultValue || ''}
                />
              </p>
              <p className={classNames('control', { 'is-loading': loading })}>
                <input
                  className="input"
                  id={`to-filter${name}`}
                  min={filter[name]?.from}
                  name={name}
                  onChange={this.onRangeChange}
                  placeholder={formatMessage(messages.to)}
                  type="date"
                  value={filter[name]?.to || ''}
                />
              </p>
            </React.Fragment>
          );
          break;
        }
        case 'number': {
          if (!range) {
            control = (
              <input
                className="input"
                id={`filter${name}`}
                name={name}
                onChange={this.onChange}
                type="number"
                value={filter[name] || defaultValue || ''}
              />
            );
            break;
          }
          control = (
            <React.Fragment>
              <p className={classNames('control', { 'is-loading': loading })}>
                <input
                  className="input"
                  id={`filter${name}`}
                  max={filter[name]?.to}
                  name={name}
                  onChange={this.onRangeChange}
                  placeholder={formatMessage(messages.from)}
                  type="number"
                  value={filter[name]?.from || defaultValue || ''}
                />
              </p>
              <p className={classNames('control', { 'is-loading': loading })}>
                <input
                  className="input"
                  id={`to-filter${name}`}
                  min={filter[name]?.from}
                  name={name}
                  onChange={this.onRangeChange}
                  placeholder={formatMessage(messages.to)}
                  type="number"
                  value={filter[name]?.to || ''}
                />
              </p>
            </React.Fragment>
          );
          break;
        }
        case 'string':
        default: {
          control = (
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
    }

    return (
      <div className="field is-horizontal">
        <div className="field-label is-normal">{labelElement}</div>
        <div className={classNames('field', 'field-body', { 'is-grouped': range })}>
          {range ? (
            control
          ) : (
            <div className={classNames('control', { 'is-loading': loading })}>{control}</div>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { block } = this.props;
    const { isOpen } = this.state;
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
                    <React.Fragment key={field.name}>{this.generateField(field)}</React.Fragment>
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
          <div className={styles.highlighted}>{this.generateField(highlightedField)}</div>
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
