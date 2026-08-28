import { type BlockProps } from '@appsemble/preact';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useEffect } from 'preact/hooks';

import { FooterListColumn } from './components/FooterListColumn/index.js';
import { ImageComponent } from './components/ImageComponent/index.js';

export function Footer({
  data,
  parameters: { alignment, backgroundColor, columns, copyright, textColor },
  ready,
  utils: { remap },
}: BlockProps): VNode {
  useEffect(() => ready(), [ready]);
  const copyrightText = remap(copyright, data) as string;
  return (
    <footer
      className={classNames(
        'footer',
        'mt-2',
        'pb-2',
        backgroundColor && `has-background-${backgroundColor}`,
        alignment && `has-text-${alignment === 'center' ? 'centered' : alignment}`,
      )}
    >
      <div className="container">
        <div className="columns">
          {columns.map((item, index) =>
            item.type === 'image' && remap(item.image.hide, data) ? null : (
              <div className="column" key={`${item.type}-${index}`}>
                {item.type === 'image' ? (
                  <ImageComponent field={item.image} />
                ) : (
                  <FooterListColumn column={item} />
                )}
              </div>
            ),
          )}
        </div>
        {copyrightText ? (
          <div className={classNames('has-text-centered', textColor && `has-text-${textColor}`)}>
            {copyrightText}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
