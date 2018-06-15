import PropTypes from 'prop-types';
import React from 'react';


export default class Block extends React.Component {
  static propTypes = {
    block: PropTypes.shape().isRequired,
  };

  render() {
    const {
      block,
    } = this.props;
    const {
      size = 0,
    } = block;

    return (
      <div
        style={{
          flex: `${size} 1 auto`,
        }}
      >
        {block.type}
      </div>
    );
  }
}
