/** @jsx createElement */
import { attach } from '@appsemble/sdk';

import check from './check.svg';
import cross from './cross.svg';
import styles from './index.css';

function createElement(tagName, props, ...children) {
  const node = Object.assign(document.createElement(tagName), props);
  children
    .map(child => (typeof child === 'string' ? document.createTextNode(child) : child))
    .forEach(::node.appendChild);
  return node;
}

attach(({ actions, data }) => {
  const loading = <span className={styles.subheader}>Loading…</span>;
  const root = <div className={styles.root}>{loading}</div>;
  actions.load.dispatch(data).then(
    () => {
      root.replaceChild(
        <header className={styles.content}>
          <div className={styles.circle}>
            <img alt="Success" className={styleMedia.icon} src={check} />
          </div>
          <h2 className={styles.header}>Gelukt</h2>
          <span className={styles.subheader}>Dankjewel</span>
        </header>,
        loading,
      );
      setTimeout(() => {
        actions.success.dispatch(data);
      }, 2e3);
    },
    () => {
      const button = (
        <button className={styles.circle} type="button">
          <img alt="Action failed" className={styleMedia.icon} src={cross} />
        </button>
      );
      const header = (
        <header className={styles.content}>
          {button}
          <h2 className={styles.header}>Fout</h2>
          <span className={styles.subheader}>Probeer het opnieuw</span>
        </header>
      );
      button.addEventListener('click', () => {
        actions.error.dispatch({});
      });
      root.replaceChild(header, loading);
    },
  );
  return root;
});
