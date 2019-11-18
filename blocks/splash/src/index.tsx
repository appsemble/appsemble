/** @jsx h */
import { attach } from '@appsemble/sdk';
import { h } from 'mini-jsx';

import { Actions, Parameters } from '../block';
import animationLoop from './animation-loop.gif';
import animationStart from './animation-start.gif';
import check from './check.svg';
import cross from './cross.svg';
import styles from './index.css';

// Length of the opening animation of the spinning wheel in milliseconds.
const ANIMATION_LENGTH = 2190;

attach<Parameters, Actions>(({ actions, data }) => {
  let loading: HTMLImageElement;
  const root = (
    <div className={styles.root}>
      <img
        ref={node => {
          loading = node;
        }}
        alt="Loading…"
        className={styles.loading}
        src={animationStart}
      />
    </div>
  );
  setTimeout(() => {
    loading.src = animationLoop;
  }, ANIMATION_LENGTH);
  actions.onLoad.dispatch(data).then(
    response => {
      setTimeout(() => {
        root.replaceChild(
          <header className={styles.content}>
            <div className={styles.circle}>
              <img alt="Success" className={styles.icon} src={check} />
            </div>
            <h2 className={`has-text-primary ${styles.header}`}>Gelukt</h2>
            <span className={styles.subheader}>Dankjewel</span>
          </header>,
          loading,
        );
        root.classList.add(styles.done);

        setTimeout(() => {
          actions.onSuccess.dispatch(response);
        }, 2e3);
      }, 4e3);
    },
    () => {
      root.replaceChild(
        <header className={styles.content}>
          <button
            className={styles.circle}
            onclick={() => {
              actions.onError.dispatch({});
            }}
            type="button"
          >
            <img alt="Action failed" className={styles.icon} src={cross} />
          </button>
          <h2 className={`has-text-primary ${styles.header}`}>Fout</h2>
          <span className={styles.subheader}>
            Druk op de bovenstaande knop om het opnieuw te proberen
          </span>
        </header>,
        loading,
      );
    },
  );
  return root;
});
