import PropTypes from 'prop-types';
import React from 'react';

import Block from '../Block';


/**
 * Render an app page definition.
 */
export default class Page extends React.Component {
  static propTypes = {
    /**
     * The page definition to render
     */
    page: PropTypes.shape().isRequired,
  };

  render() {
    const {
      page,
    } = this.props;

    return page.blocks.map((block, index) => (
      // As long as blocks are in a static list, using the index as a key should be fine.
      // eslint-disable-next-line react/no-array-index-key
      <Block key={index} block={block} />
    ));
  }
}
