import { bootstrap } from '@appsemble/preact';
import classNames from 'classnames';
import { useEffect } from 'preact/hooks';

import { FooterListColumn } from './components/FooterListColumn/index.js';
import { ImageComponent } from './components/ImageComponent/index.js';

bootstrap(
  ({
    data,
    parameters: { alignment, backgroundColor, columns, copyright, textColor },
    ready,
    utils: { remap },
  }) => {
    useEffect(() => ready());
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
            {columns.map((item) => {
              if (item.type === 'image') {
                return (
                  <div className="column">
                    <ImageComponent field={item.image} />
                  </div>
                );
              }
              return (
                <div className="column">
                  <FooterListColumn column={item} />
                </div>
              );
            })}
          </div>
          {copyrightText ? (
            <div className={classNames('has-text-centered', textColor && `has-text-${textColor}`)}>
              {copyrightText}
            </div>
          ) : null}
        </div>
      </footer>
    );
  },
);
