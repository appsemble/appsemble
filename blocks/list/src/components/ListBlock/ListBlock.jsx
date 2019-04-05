import React from 'react';
import PropTypes from 'prop-types';
import { remapData } from '@appsemble/utils/remap';
import { Loader } from '@appsemble/react-components';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
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

  state = { data: undefined, error: false, loading: true };

  async componentDidMount() {
    const { actions } = this.props;

    try {
      const data = await actions.load.dispatch();
      this.setState({ data, loading: false });
    } catch (e) {
      this.setState({ error: true, loading: false });
    }
  }

  async onClick(item) {
    const { actions } = this.props;

    if (actions.click) {
      await actions.click.dispatch(item);
    }
  }

  render() {
    const { block, actions } = this.props;
    const { data, error, loading } = this.state;
    const { fields } = block.parameters;

    if (loading) {
      return <Loader />;
    }

    if (error) {
      return <FormattedMessage {...messages.error} />;
    }

    if (!data.length) {
      return <FormattedMessage {...messages.noData} />;
    }

    return (
      <table className="table is-hoverable is-striped is-fullwidth">
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
              className={actions.click.type !== 'noop' ? styles.clickable : undefined}
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
