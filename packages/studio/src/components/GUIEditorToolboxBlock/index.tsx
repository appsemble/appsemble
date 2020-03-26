import { Icon, Loader } from '@appsemble/react-components';
import { IconName } from '@fortawesome/fontawesome-common-types';
import axios from 'axios';
import React from 'react';

import styles from './index.css';

export interface Block {
  id: string;
  description?: string;
  iconName: IconName;
}

export default function GUIEditorToolboxBlock(params: any): React.ReactElement {
  const [blocks, setBlocks] = React.useState<Block[]>();
  const [selectedBlock, setSelectedBlock] = React.useState<Block>();

  React.useEffect(() => {
    const getBlocks = async (): Promise<void> => {
      setBlocks(undefined);
      const { data } = await axios.get('/api/blocks');
      const blocksArr: Block[] = [];
      data.map((block: Block): Block[] => {
        let iconName: IconName = 'question';
        switch (block.id.split('/')[1]) {
          case 'map':
            iconName = 'map-marked-alt';
            break;
          case 'navigation':
            iconName = 'route';
            break;
          case 'markdown':
            iconName = 'font';
            break;
          case 'stats':
            iconName = 'chart-bar';
            break;
          case 'table':
            iconName = 'table';
            break;
          case 'action-button':
            iconName = 'plus-square';
            break;
          case 'data-loader':
            iconName = 'database';
            break;
          case 'detail-viewer':
            iconName = 'eye';
            break;
          case 'feed':
            iconName = 'pager';
            break;
          case 'filter':
            iconName = 'filter';
            break;
          case 'form':
            iconName = 'poll-h';
            break;
          case 'list':
            iconName = 'list';
            break;
          default:
            iconName = 'question';
            break;
        }

        blocksArr.push({
          id: block.id,
          description: block.description,
          iconName,
        });

        return blocksArr;
      });
      setBlocks(blocksArr);
    };
    getBlocks();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setSelectedBlock(undefined);
      params.selectedBlock(undefined);
    }
  };

  if (blocks === [] || blocks === undefined) {
    return <Loader />;
  }

  return (
    <div className={styles.main}>
      {blocks.map((block: Block) => (
        <div
          key={block.id}
          className={selectedBlock === block ? styles.blockFrameSelected : styles.blockFrame}
          onClick={() => [setSelectedBlock(block), params.selectedBlock(block)]}
          onKeyDown={() => onKeyDown}
          role="button"
          tabIndex={0}
        >
          <Icon icon={block.iconName} size="large" />
          <h2 className={styles.subtext}>{block.id.split('/')[1]}</h2>
        </div>
      ))}
    </div>
  );
}
