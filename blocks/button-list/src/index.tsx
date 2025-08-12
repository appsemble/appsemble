import { bootstrap } from '@appsemble/sdk';
import classNames from 'classnames';

bootstrap(({ actions, data, events, parameters: { alignment, buttons }, utils }) => (
  <div
    className={`buttons is-${alignment === 'left' || alignment === 'right' ? alignment : 'centered'}`}
  >
    {buttons.map(
      ({
        color,
        disable,
        fullwidth,
        hide,
        icon,
        iconSide,
        inverted,
        label,
        light,
        onClick = 'onClick',
        outlined,
        rounded,
        size = 'normal',
        title,
      }) => {
        const action = actions[onClick];
        const node =
          // Accessible content is added below.
          // eslint-disable-next-line jsx-a11y/anchor-has-content
          action?.type === 'link' ? <a href={action.href()} /> : <button type="button" />;
        node.className = classNames('button', `is-${size}`, {
          'is-rounded': rounded,
          'is-fullwidth': fullwidth,
          [`is-${color}`]: color,
          'is-light': light,
          'is-inverted': inverted,
          'is-outlined': outlined,
        });
        node.title = (utils.remap(title, data) as string) ?? '';
        if (!iconSide && icon) {
          node.append(
            <span className="icon">
              <i className={utils.fa(icon)} />
            </span>,
          );
        }

        const createNode = (newData: unknown): ChildNode => {
          const newText = utils.remap(label, newData);
          return typeof newText === 'string' ||
            (typeof newText === 'number' && Number.isFinite(newText)) ? (
            <span>{newText}</span>
          ) : (
            // Even if the label is empty, we want to be able to replace the node when new data is
            // is received.
            document.createTextNode('')
          );
        };
        let currentText = createNode(data);
        let currentData = data;
        node.append(currentText);
        events.on.data((newData) => {
          const newText = createNode(newData);
          const hidden = utils.remap(hide, newData);
          if (hidden) {
            node.classList.add('is-hidden');
          }
          const disabled = utils.remap(disable, newData);
          if (disabled) {
            node.setAttribute('disabled', 'true');
          }
          currentText.replaceWith(newText);
          currentText = newText;
          currentData = newData;
        });

        node.addEventListener('click', (event) => {
          // Delegate anchor behavior to the link action.
          event.preventDefault();
          action(currentData);
        });

        if (iconSide && icon) {
          node.append(
            <span className="icon">
              <i className={utils.fa(icon)} />
            </span>,
          );
        }
        return node;
      },
    )}
  </div>
));
