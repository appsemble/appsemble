import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@appsemble/react-bulma';

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
    const data = await actions.load.dispatch();

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
      <Table>
        <TableHead>
          <TableRow>
            {fields.map(field => (
              <TableHeaderCell>{field}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(item => fields.map(field => <TableCell>{item[field]}</TableCell>))}
        </TableBody>
      </Table>
    );
  }
}
