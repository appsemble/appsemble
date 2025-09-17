import { bootstrap, type IconName } from '@appsemble/sdk';

import styles from './index.module.css';

function isValidUrl(string: string): boolean {
  let url;

  try {
    url = new URL(string);
  } catch {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

const hexColor = /^#[\dA-Fa-f]{6}$/;
const bulmaColors = new Set([
  'danger',
  'dark',
  'info',
  'link',
  'primary',
  'success',
  'warning',
  'white',
]);

bootstrap(
  ({ actions: { onClick }, events, parameters, utils: { asset, fa, formatMessage, remap } }) => {
    const wrapper = (
      <div className={styles.wrapper}>
        <div className={styles.loader} />
      </div>
    );

    events.on.data((data, error) => {
      while (wrapper.lastElementChild) {
        wrapper.lastElementChild.remove();
      }

      if (error) {
        wrapper.append(formatMessage('loadError'));
        return;
      }

      const results = ([] as any[]).concat(data);

      wrapper.append(
        ...results.map((result) => {
          const image = remap(parameters.image, result) as string;
          const color = remap(parameters.color, result) as string;
          const text = remap(parameters.text, result) as string;
          const icon = remap(parameters.icon, result) as IconName;
          const isUrl = isValidUrl(image);

          const className = `${styles.tile} px-3 py-3 ${
            bulmaColors.has(color) ? `has-background-${color}` : ''
          }`;
          const style = hexColor.test(color) ? { backgroundColor: color } : {};
          const children = [
            image ? (
              <img alt={text} src={isUrl ? image : asset(image)} />
            ) : icon ? (
              <i className={`${fa(icon)} ${styles.icon}`} />
            ) : undefined,
            text && (
              <p className="has-text-centered" style={style}>
                {text}
              </p>
            ),
          ];

          const element =
            onClick.type === 'link' ? (
              <a className={className} href={onClick.href(result)} style={style}>
                {children}
              </a>
            ) : (
              <div className={className} style={style}>
                {children}
              </div>
            );
          element.addEventListener('click', (event) => {
            event.preventDefault();
            onClick(result);
          });
          return element;
        }),
      );
    });

    return <div>{wrapper}</div>;
  },
);
