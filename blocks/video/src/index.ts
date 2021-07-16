import { bootstrap } from '@appsemble/sdk';
import Vimeo from '@vimeo/player';

import styles from './index.module.css';

// https://github.com/vimeo/player.js/blob/989954e5645999c7ef0e5fbccaea04dedf1bec17/src/lib/functions.js#L61
const vimeoRegex = /^(https?:)?\/\/((player|www)\.)?vimeo\.com(?=$|\/)/;

bootstrap(
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
    const errorNode = document.createElement('article');
    errorNode.className = `my-4 message is-danger ${styles.error}`;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'message-body';
    errorMessage.textContent = utils.formatMessage('loadErrorMessage');
    errorNode.append(errorMessage);
    let player: Vimeo;
    let playerDiv: HTMLDivElement;
    utils.addCleanup(() => player?.destroy());

    const setupError = (): void => {
      player?.destroy();
      playerDiv?.remove();
      shadowRoot.append(errorNode);
    };

    const setupPlayer = (id: string): void => {
      const valid = vimeoRegex.test(id);
      if (!valid) {
        setupError();
        return;
      }

      const newPlayerDiv = document.createElement('div');
      newPlayerDiv.className = styles.container;

      if (width) {
        newPlayerDiv.style.width = width;
      }
      if (maxWidth) {
        newPlayerDiv.style.maxWidth = maxWidth;
      }
      if (height) {
        newPlayerDiv.style.height = height;
      }
      if (maxHeight) {
        newPlayerDiv.style.maxHeight = maxHeight;
      }

      playerDiv?.remove();
      player?.destroy();

      playerDiv = newPlayerDiv;
      shadowRoot.append(playerDiv);

      player = new Vimeo(newPlayerDiv, {
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
