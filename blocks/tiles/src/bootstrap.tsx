import { type BootstrapParams, type IconReference } from '@appsemble/sdk';

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

export function Tiles({
  actions: { onClick },
  events,
  parameters,
  utils: { asset, formatMessage, icon: createIcon, remap },
}: BootstrapParams): HTMLElement {
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
        const icon = remap(parameters.icon, result) as IconReference;
        const isUrl = isValidUrl(image);

        const className = `${styles.tile} px-3 py-3 ${
          bulmaColors.has(color) ? `has-background-${color}` : ''
        }`;
        const style = hexColor.test(color) ? { backgroundColor: color } : {};
        const children = [
          image ? (
            <img alt="" src={isUrl ? image : asset(image)} />
          ) : icon ? (
            createIcon(icon, { className: styles.icon })
          ) : undefined,
          text && (
            <span className="has-text-centered" style={style}>
              {text}
            </span>
          ),
        ];

        const element =
          onClick.type === 'link' ? (
            <a className={className} href={onClick.href(result)} style={style}>
              {children}
            </a>
          ) : (
            <button className={className} style={style} type="button">
              {children}
            </button>
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
}
