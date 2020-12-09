// eslint-disable-next-line unicorn/import-style
import * as Sentry from '@sentry/browser';
import { mount } from 'enzyme';
import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { ErrorHandler } from '.';

beforeEach(() => {
  jest.spyOn(Sentry, 'captureException').mockReturnValue('stub-event-id');
});

it('should render its children if no errors are thrown', () => {
  function Child(): ReactElement {
    return <p>Test</p>;
  }
  function Fallback(): ReactElement {
    return <p>Something went wrong!</p>;
  }
  const result = mount(
    <BrowserRouter>
      <ErrorHandler fallback={Fallback}>
        <Child />
      </ErrorHandler>
    </BrowserRouter>,
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
    <BrowserRouter>
      <ErrorHandler fallback={Fallback}>
        <Child />
      </ErrorHandler>
    </BrowserRouter>,
  );

  expect(result).toMatchSnapshot();
});
