import { shallow } from 'enzyme';
import React from 'react';

import Loader from '.';

describe('Loader', () => {
  it('should match its snapshot', () => {
    const result = shallow(<Loader />);
    expect(result).toMatchSnapshot();
  });
});
