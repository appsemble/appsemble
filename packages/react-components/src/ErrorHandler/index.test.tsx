import { mount } from 'enzyme';
import React, { ReactElement } from 'react';

import { ErrorHandler } from '.';

it('should render its children if no errors are thrown', () => {
  function Child(): ReactElement {
    return <p>Test</p>;
  }
  function Fallback(): ReactElement {
    return <p>Something went wrong!</p>;
  }
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
    throw new Error('test');
  };
  function Fallback(): ReactElement {
    return <p>Something went wrong!</p>;
  }
  const result = mount(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  expect(result).toMatchSnapshot();
});
