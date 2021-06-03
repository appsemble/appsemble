import { attach } from '@appsemble/sdk';
import Vimeo from '@vimeo/player';

import styles from './index.module.css';

const vimeoRegex = /^(https?:)?\/\/((player|www)\.)?vimeo\.com(?=$|\/)/;

attach(
  ({
    actions,
    data,
    events,
    parameters: {
      autoplay = false,
      height,
      maxHeight,
      maxWidth,
      muted = false,
      url,
      volume,
      width,
    },
    shadowRoot,
    theme,
    utils,
  }) => {
    const onFinish = (): Promise<void> => actions.onFinish(data);

    const setupError = (): void => {
      const errorNode = document.createElement('article');
      errorNode.className = `my-4 message is-danger ${styles.error}`;
      const errorMessage = document.createElement('div');
      errorMessage.className = 'message-body';
      errorMessage.textContent = utils.formatMessage('loadErrorMessage');

      errorNode.append(errorMessage);
      shadowRoot.append(errorNode);
    };

    const setupPlayer = (id: string): void => {
      const valid = vimeoRegex.test(id);
      if (!valid) {
        setupError();
        return;
      }

      const playerDiv = document.createElement('div');
      playerDiv.className = styles.container;
      shadowRoot.append(playerDiv);

      if (width) {
        playerDiv.style.width = width;
      }
      if (maxWidth) {
        playerDiv.style.maxWidth = maxWidth;
      }
      if (height) {
        playerDiv.style.height = height;
      }
      if (maxHeight) {
        playerDiv.style.maxHeight = maxHeight;
      }

      const player = new Vimeo(playerDiv, {
        autoplay,
        color: theme.primaryColor,
        byline: false,
        dnt: true,
        portrait: false,
        responsive: true,
        muted,
        url: id,
        title: false,
      });

      if (volume != null) {
        player.setVolume(volume / 100);
      }

      player.on('ended', onFinish);
    };

    const hasEvent = events.on.onVideo((d) => {
      if (typeof d !== 'string') {
        setupError();
        return;
      }

      setupPlayer(d);
    });

    if (!hasEvent) {
      const id = utils.remap(url, data);
      setupPlayer(id);
    }
  },
);
