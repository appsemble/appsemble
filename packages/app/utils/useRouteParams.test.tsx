import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { Route } from 'wouter-preact';
import { expect, it } from 'vitest';

import { useRouteParams } from './useRouteParams.js';

function ParamsProbe(): ReactNode {
  return <p>{JSON.stringify(useRouteParams())}</p>;
}

it('should decode the named route parameters', () => {
  window.history.replaceState(null, '', '/en/item/a%26b%2Fc%20d%3F%C3%A9');
  render(
    <Route path="/:lang/:pageId/:id">
      <ParamsProbe />
    </Route>,
  );
  expect(JSON.parse(screen.getByRole('paragraph').textContent!)).toStrictEqual({
    lang: 'en',
    pageId: 'item',
    id: 'a&b/c d?é',
  });
});
