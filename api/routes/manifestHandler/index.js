const iconSizes = [
  48,
  144,
  192,
  512,
];


/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function manifestHandler(ctx) {
  const {
    id,
  } = ctx.params;

  ctx.body = {
    background_color: '#ff8c7d',
    display: 'standalone',
    icons: iconSizes.map(size => ({
      src: `/${id}/icon-${size}.png`,
      type: 'image/png',
      sizes: `${size}x${size}`,
    })),
    name: 'Unlittered',
    orientation: 'any',
    short_name: 'Unlittered',
    start_url: `/${id}`,
    theme_color: '#ff2f15',
  };
}
