import React from 'react';
import renderer from 'react-test-renderer';

import ErrorHandler from './ErrorHandler';

it('should render its children if no errors are thrown', () => {
  const Child = () => <p>Test</p>;
  const Fallback = () => <p>Something went wrong!</p>;
  const result = renderer.create(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  expect(result).toMatchSnapshot();
});

it('should render its fallback when errors are thrown', () => {
  const Child = () => {
    throw Error('test');
  };
  const Fallback = () => <p>Something went wrong!</p>;
  const result = renderer.create(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  expect(result).toMatchSnapshot();
});
