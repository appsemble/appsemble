import { mount } from 'enzyme';
import React, { ReactElement } from 'react';

import ErrorHandler from '.';

it('should render its children if no errors are thrown', () => {
  const Child = (): ReactElement => <p>Test</p>;
  const Fallback = (): ReactElement => <p>Something went wrong!</p>;
  const result = mount(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  expect(result).toMatchSnapshot();
});

it('should render its fallback when errors are thrown', () => {
  jest.spyOn(console, 'error').mockImplementation();
  const Child = (): ReactElement => {
    throw Error('test');
  };
  const Fallback = (): ReactElement => <p>Something went wrong!</p>;
  const result = mount(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  expect(result).toMatchSnapshot();
});
