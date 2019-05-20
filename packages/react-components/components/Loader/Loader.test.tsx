import * as React from 'react';
import { shallow } from 'enzyme';

import Loader from './Loader';

describe('Loader', () => {
  it('should match its snapshot', () => {
    const result = shallow(<Loader />);
    expect(result).toMatchSnapshot();
  });
});
