import PropTypes from 'prop-types';
import React from 'react';

export default class TableBlock extends React.Component {
  static propTypes = {
    /**
     * The actions as passed by the Appsemble interface.
     */
    actions: PropTypes.shape().isRequired,
    /**
     * The block as passed by the Appsemble interface.
     */
    block: PropTypes.shape().isRequired,
  };

  state = { data: [] };

  async componentDidMount() {
    const { actions } = this.props;
    const data = await actions.onLoad.dispatch();

    this.setState({ data });
  }

  render() {
    const { block } = this.props;
    const { data } = this.state;
    const { fields } = block.parameters;

    if (!data.length) {
      return <p>No data.</p>;
    }

    return (
      <table className="table">
        <thead>
          <tr>
            {fields.map(field => (
              <th key={field}>{field}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, dataIndex) => (
            <tr key={item.id || dataIndex}>
              {fields.map(field => (
                <td key={field}>{item[field]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
