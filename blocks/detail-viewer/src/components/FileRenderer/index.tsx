import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { Fragment, h, VNode } from 'preact';

import type { FileField, RendererProps } from '../../../block';
import ImageField from '../ImageField';
import styles from './index.css';

/**
 * Render a string as is.
 */
export default function FileRenderer({ field, value }: RendererProps<FileField>): VNode {
  const { utils } = useBlock();

  return (
    <Fragment>
      {field.label && <h6 className="title is-6">{field.label}</h6>}
      {field.repeated ? (
        <div className={classNames('container', styles.repeated)}>
          {((value || []) as string[]).map((v, index) => (
            <ImageField
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              label={field.label}
              name={field.name}
              src={field.repeatedName ? utils.remap(field.repeatedName, v) : v}
            />
          ))}
        </div>
      ) : (
        value && <ImageField label={field.label} name={field.name} src={value} />
      )}
    </Fragment>
  );
}
