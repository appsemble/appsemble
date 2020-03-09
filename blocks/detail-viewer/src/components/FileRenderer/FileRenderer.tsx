/** @jsx h */
import { remapData } from '@appsemble/utils';
import classNames from 'classnames';
import { Fragment, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FileField, RendererProps } from '../../../block';
import styles from './FileRenderer.css';

/**
 * Render a string as is.
 */
export default function FileRenderer({
  block,
  field,
  utils,
  value,
}: RendererProps<FileField>): VNode {
  const getSrc = useCallback(
    (v: string | Blob): string => {
      if (v instanceof Blob) {
        const url = URL.createObjectURL(v);
        utils.addCleanup(() => URL.revokeObjectURL(url));
        return url;
      }

      return `${new URL(`${utils.asset(v)}`, window.location.origin)}`;
    },
    [block, utils],
  );

  return (
    <Fragment>
      {field.label && <h6 className="title is-6">{field.label}</h6>}
      {field.repeated ? (
        <div className={classNames('container', styles.repeated)}>
          {((value || []) as string[]).map((v, index) => (
            <figure
              // eslint-disable-next-line react/no-array-index-key
              key={`${field.label || field.name}.${index}`}
              className={classNames('image', styles.root)}
            >
              <img
                alt={field.label || field.name}
                className={styles.img}
                src={getSrc(field.repeatedName ? remapData(field.repeatedName, v) : v)}
              />
            </figure>
          ))}
        </div>
      ) : (
        <figure className={classNames('image', styles.root)}>
          <img
            alt={field.label || field.name}
            className={styles.img}
            src={getSrc(value as string)}
          />
        </figure>
      )}
    </Fragment>
  );
}
