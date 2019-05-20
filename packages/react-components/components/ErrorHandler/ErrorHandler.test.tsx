import { mount } from 'enzyme';
import * as React from 'react';

import ErrorHandler from './ErrorHandler';

it('should render its children if no errors are thrown', () => {
  const Child = (): JSX.Element => <p>Test</p>;
  const Fallback = (): JSX.Element => <p>Something went wrong!</p>;
  const result = mount(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  expect(result).toMatchSnapshot();
});

it('should render its fallback when errors are thrown', () => {
  jest.spyOn(console, 'error').mockImplementation();
  const Child = (): JSX.Element => {
    throw Error('test');
  };
  const Fallback = (): JSX.Element => <p>Something went wrong!</p>;
  const result = mount(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  expect(result).toMatchSnapshot();
});
