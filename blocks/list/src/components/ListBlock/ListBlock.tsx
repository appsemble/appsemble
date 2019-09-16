/** @jsx h */
import { BlockProps, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { Component, h, VNode } from 'preact';

import { Actions, Parameters } from '../../../types';
import styles from './ListBlock.css';

interface Item {
  id?: number;
}

interface ListBlockState {
  data: Item[];
  error: boolean;
  loading: boolean;
}

export default class ListBlock extends Component<BlockProps<Parameters, Actions>, ListBlockState> {
  state: ListBlockState = { data: undefined, error: false, loading: true };

  async componentDidMount(): Promise<void> {
    const { actions } = this.props;

    try {
      const data = await actions.onLoad.dispatch();
      this.setState({ data, loading: false });
    } catch (e) {
      this.setState({ error: true, loading: false });
    }
  }

  onClick(item: Item): void {
    const { actions } = this.props;

    if (actions.onClick) {
      actions.onClick.dispatch(item);
    }
  }

  render(): VNode {
    const { block, actions } = this.props;
    const { data, error, loading } = this.state;
    const { fields } = block.parameters;

    if (loading) {
      return <Loader />;
    }

    if (error) {
      return <FormattedMessage id="error" />;
    }

    if (!data.length) {
      return <FormattedMessage id="noData" />;
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
              className={actions.onClick.type !== 'noop' ? styles.clickable : undefined}
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
