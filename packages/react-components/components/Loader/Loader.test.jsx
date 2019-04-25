import React from 'react';
import renderer from 'react-test-renderer';

import Loader from './Loader';

describe('Loader', () => {
  it('should match its snapshot', () => {
    const result = renderer.create(<Loader />).toJSON();
    expect(result).toMatchSnapshot();
  });
});
