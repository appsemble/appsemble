import { baseTheme } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { DivIcon } from 'leaflet';
import { expect, it } from 'vitest';

import { Location } from './index.js';

it('should not present the marker as a button', () => {
  render(
    <Context.Provider value={{} as BlockProps}>
      <Location
        label="Map"
        latitude={52}
        longitude={5}
        marker={new DivIcon({ html: '<span>Marker</span>' })}
        radius={10}
        theme={baseTheme}
      />
    </Context.Provider>,
  );

  const marker = screen.getByText('Marker');
  expect(screen.queryByRole('button', { name: 'Marker' })).toBeNull();
  expect(marker.parentElement!.tabIndex).toBe(-1);
});
