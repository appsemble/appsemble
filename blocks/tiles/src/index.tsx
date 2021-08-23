import { bootstrap } from '@appsemble/sdk';

import styles from './index.module.css';

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

      const results = [].concat(data);

      wrapper.append(
        ...results.map((result) => {
          const assetId = remap(parameters.asset, result);
          const color = remap(parameters.color, result);
          const text = remap(parameters.text, result);
          const icon = remap(parameters.icon, result);

          const className = `${styles.tile} px-3 py-3 has-background-${color}`;
          const children = [
            assetId ? (
              <img alt={text} src={asset(assetId)} />
            ) : icon ? (
              <i className={`${fa(icon)} ${styles.icon}`} />
            ) : undefined,
            text && <p className="has-text-centered">{text}</p>,
          ];

          const element =
            onClick.type === 'link' ? (
              <a className={className} href={onClick.href(result)}>
                {children}
              </a>
            ) : (
              <div className={className}>{children}</div>
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
