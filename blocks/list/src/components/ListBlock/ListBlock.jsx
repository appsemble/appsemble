import React from 'react';
import PropTypes from 'prop-types';
import { remapData } from '@appsemble/utils/remap';

import styles from './ListBlock.css';

export default class ListBlock extends React.Component {
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
    const data = await actions.load.dispatch();

    this.setState({ data });
  }

  async onClick(item) {
    const { actions } = this.props;

    if (actions.click) {
      await actions.click.dispatch(item);
    }
  }

  render() {
    const { block } = this.props;
    const { data } = this.state;
    const { fields } = block.parameters;

    if (!data.length) {
      return <p>No data.</p>;
    }

    return (
      <table className="table is-hoverable is-striped">
        <thead>
          <tr>
            {fields.map(field => (
              <th key={`header.${field.name}`}>{field.label || field.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, dataIndex) => (
            <tr
              key={item.id || dataIndex}
              className={styles.dataRow}
              onClick={() => this.onClick(item)}
            >
              {fields.map(field => {
                const value = remapData(field.name, item);

                return (
                  <td key={field.name}>
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
