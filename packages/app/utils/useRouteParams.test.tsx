import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { Route, Router } from 'wouter-preact';
import { expect, it } from 'vitest';

import { useRawLocation } from './useRawLocation.js';
import { useRouteParams } from './useRouteParams.js';

function ParamsProbe(): ReactNode {
  return <p>{JSON.stringify(useRouteParams())}</p>;
}

it('should decode the named route parameters', () => {
  window.history.replaceState(null, '', '/en/item/a%26b%2Fc%20d%3F%C3%A9%2526');
  render(
    <Router hook={useRawLocation}>
      <Route path="/:lang/:pageId/:id">
        <ParamsProbe />
      </Route>
    </Router>,
  );
  expect(JSON.parse(screen.getByRole('paragraph').textContent!)).toStrictEqual({
    lang: 'en',
    pageId: 'item',
    id: 'a&b/c d?é%26',
  });
});
