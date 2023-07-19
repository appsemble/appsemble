import { render } from '@testing-library/react';
import { type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { ErrorHandler } from './index.js';

it('should render its children if no errors are thrown', () => {
  function Child(): ReactElement {
    return <p>Test</p>;
  }
  function Fallback(): ReactElement {
    return <p>Something went wrong!</p>;
  }
  const { container } = render(
    <BrowserRouter>
      {/* eslint-disable-next-line react/jsx-no-bind */}
      <ErrorHandler fallback={Fallback}>
        <Child />
      </ErrorHandler>
    </BrowserRouter>,
  );

  expect(container).toMatchSnapshot();
});

it('should render its fallback when errors are thrown', () => {
  vi.spyOn(console, 'error').mockImplementation(null);
  const Child = (): ReactElement => {
    throw new Error('test');
  };
  function Fallback(): ReactElement {
    return <p>Something went wrong!</p>;
  }
  const { container } = render(
    <BrowserRouter>
      {/* eslint-disable-next-line react/jsx-no-bind */}
      <ErrorHandler fallback={Fallback}>
        <Child />
      </ErrorHandler>
    </BrowserRouter>,
  );

  expect(container).toMatchSnapshot();
});
