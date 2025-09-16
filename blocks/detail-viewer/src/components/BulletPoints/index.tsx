import { useBlock } from '@appsemble/preact';
import { isPreactChild } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { type BulletPoints as BulletPointsType, type RendererProps } from '../../../block.js';
import { Field } from '../Field/index.js';

/**
 * Renders a bullet points.
 */
export function BulletPoints({
  data,
  field: {
    bulletType = 'none',
    bullets: { description, heading },
    hide,
    label,
    value,
  },
}: RendererProps<BulletPointsType>): VNode | null {
  const { utils } = useBlock();

  const listRef = useRef<HTMLOListElement>(null);

  const remappedLabel = utils.remap(label, data);
  const remappedValue = utils.remap(value, data);
  const remappedHide = utils.remap(hide, data);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.style.listStyleType = bulletType;
    }
  }, [bulletType]);

  return remappedHide ? null : (
    <div className="appsemble-group">
      {isPreactChild(remappedLabel) ? <h5 className="title is-5">{remappedLabel}</h5> : null}
      {Array.isArray(remappedValue) ? (
        <ol
          className={bulletType === 'horizontal' ? styles.horizontalList : undefined}
          ref={listRef}
        >
          {remappedValue.flatMap((val) => (
            <li>
              <Field data={val} field={heading} />
              <div>
                {description ? (
                  <dd>
                    <Field data={val} field={description} />
                  </dd>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
