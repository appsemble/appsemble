/** @jsx h */
import { attach } from '@appsemble/sdk';
import { h } from 'mini-jsx';

import { Parameters } from '../block';
import styles from './style.css';

attach<Parameters>(({ block }) => {
  const { backLabel = 'Back', forwardLabel } = block.parameters;

  return (
    <div className={styles.container}>
      {backLabel && (
        <button
          className="button is-primary is-outlined is-pulled-left"
          onclick={() => window.history.back()}
          type="button"
        >
          <span className="icon is-small">
            <i className="fas fa-chevron-left" />
          </span>
          <span>{backLabel}</span>
        </button>
      )}

      {forwardLabel && (
        <button
          className="button is-primary is-outlined is-pulled-right"
          onclick={() => window.history.forward()}
          type="button"
        >
          <span>{forwardLabel}</span>
          <span className="icon is-small">
            <i className="fas fa-chevron-right" />
          </span>
        </button>
      )}
    </div>
  );
});
