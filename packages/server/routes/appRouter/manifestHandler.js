import { baseTheme, normalize, prefix } from '@appsemble/utils';

const iconSizes = [48, 144, 192, 512];

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function manifestHandler(ctx) {
  const { app, base } = ctx.state;

  const { defaultPage, description, name, theme = { baseTheme } } = app.definition;
  const { themeColor = '#ffffff', splashColor = themeColor } = theme;

  ctx.body = {
    background_color: splashColor,
    description,
    display: 'standalone',
    icons: iconSizes.map(size => ({
      src: prefix(`/icon-${size}.png`, base),
      type: 'image/png',
      sizes: `${size}x${size}`,
    })),
    name,
    orientation: 'any',
    scope: base || '/',
    short_name: name,
    start_url: prefix(`/${normalize(defaultPage)}`, base),
    theme_color: themeColor,
  };
  ctx.type = 'application/manifest+json';
}
