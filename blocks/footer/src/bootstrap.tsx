import { type BlockProps } from '@appsemble/preact';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useEffect } from 'preact/hooks';

import { FooterListColumn } from './components/FooterListColumn/index.js';
import { ImageComponent } from './components/ImageComponent/index.js';

const safeLinkProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function getSafeHref(link: string | undefined): string | undefined {
  const protocol = link ? URL.parse(link, window.location.href)?.protocol : undefined;
  return protocol && safeLinkProtocols.has(protocol) ? link : undefined;
}

export function Footer({
  data,
  parameters: { alignment, backgroundColor, columns, copyright, linkColor, textColor },
  ready,
  utils: { remap },
}: BlockProps): VNode {
  useEffect(() => ready(), [ready]);
  const copyrightValue = remap(copyright, data) as string | { label: string; link: string } | null;
  const copyrightLabel =
    typeof copyrightValue === 'string' ? copyrightValue : copyrightValue?.label;
  const copyrightHref =
    typeof copyrightValue === 'string' ? undefined : getSafeHref(copyrightValue?.link);
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
        {copyrightLabel ? (
          <div className={classNames('has-text-centered', textColor && `has-text-${textColor}`)}>
            {copyrightHref ? (
              <a className={classNames(linkColor && `has-text-${linkColor}`)} href={copyrightHref}>
                {copyrightLabel}
              </a>
            ) : (
              copyrightLabel
            )}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
