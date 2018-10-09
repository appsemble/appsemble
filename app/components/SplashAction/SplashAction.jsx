import PropTypes from 'prop-types';
import React from 'react';

import Block from '../Block';
import styles from './SplashAction.css';

/**
 * Render an app page definition.
 */
export default class SplashAction extends React.Component {
  static propTypes = {
    actionCreators: PropTypes.shape().isRequired,
    data: PropTypes.shape(),
    /**
     * The page definition to render
     */
    definition: PropTypes.shape().isRequired,
    getBlockDefs: PropTypes.func.isRequired,
  };

  static defaultProps = {
    data: null,
  };

  componentDidMount() {
    const { definition, getBlockDefs } = this.props;

    getBlockDefs(definition.blocks.map(({ type }) => type));
  }

  render() {
    const { actionCreators, data, definition } = this.props;

    return (
      <div className={styles.root}>
        {definition.blocks.map((block, index) => (
          // As long as blocks are in a static list, using the index as a key should be fine.
          // eslint-disable-next-line react/no-array-index-key
          <Block key={index} block={block} actionCreators={actionCreators} data={data} />
        ))}
      </div>
    );
  }
}
