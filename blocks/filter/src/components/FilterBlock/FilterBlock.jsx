import React from 'react';
import PropTypes from 'prop-types';

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
            {enumerator.map(e => (
              <option value={e.value}>{e.label || e.value}</option>
            ))}
          </select>
        </div>
      );
    }

    switch (type) {
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
    const { fields } = block.parameters;

    return (
      <React.Fragment>
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

        <button className="button" onClick={this.onFilter} type="button">
          Filter
        </button>
      </React.Fragment>
    );
  }
}
