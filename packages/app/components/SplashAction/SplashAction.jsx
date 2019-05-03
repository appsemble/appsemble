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
    events: PropTypes.shape().isRequired,
    getBlockDefs: PropTypes.func.isRequired,
  };

  static defaultProps = {
    data: null,
  };

  componentDidMount() {
    const { definition, getBlockDefs } = this.props;

    getBlockDefs(definition.blocks);
  }

  render() {
    const { actionCreators, data, events, definition } = this.props;

    return (
      <div className={styles.root}>
        {definition.blocks.map((block, index) => (
          // As long as blocks are in a static list, using the index as a key should be fine.
          <Block
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            actionCreators={actionCreators}
            block={block}
            data={data}
            emitEvent={events.emitEvent}
            offEvent={events.offEvent}
            onEvent={events.onEvent}
          />
        ))}
      </div>
    );
  }
}
