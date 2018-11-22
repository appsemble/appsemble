import { shallow } from 'enzyme';
import React from 'react';

import { Button } from '..';

describe('Button', () => {
  it('should render a button', () => {
    const component = shallow(<Button />);
    expect(component).toMatchSnapshot();
  });

  it('should be possible to pass custom class names', () => {
    const component = shallow(<Button className="custom" />);
    expect(component).toMatchSnapshot();
  });

  it('should be possible to specify the button as active using a boolean prop', () => {
    const component = shallow(<Button active />);
    expect(component).toMatchSnapshot();
  });

  it('should be possible to specify the button is loading using a boolean prop', () => {
    const component = shallow(<Button loading />);
    expect(component).toMatchSnapshot();
  });

  it('should be possible to specify a color', () => {
    const component = shallow(<Button color="primary" />);
    expect(component).toMatchSnapshot();
  });

  it('should be possible to specify a custom component', () => {
    const component = shallow(<Button component="a" />);
    expect(component).toMatchSnapshot();
  });

  it('should be possible to override the button type', () => {
    const component = shallow(<Button type="submit" />);
    expect(component).toMatchSnapshot();
  });
});
