import { type TrainingChapter } from '@appsemble/types';
import '@xyflow/react/dist/style.css';
import { type ReactNode, useMemo, useState } from 'react';
import { type Edge, type Node, ReactFlow } from 'reactflow';

import styles from './index.module.css';
import { LoginBanner } from './LoginBanner/index.js';
import { TrainingModuleNode } from './TrainingModuleNode/index.js';
import { useUser } from '../UserProvider/index.js';

interface TrainingTreeProps {
  readonly chapters: TrainingChapter[];
}

function generateNodes(chapters: TrainingChapter[]): Node[] {
  const nodes: Node[] = [];
  let nodeY = 0;

  for (const chapter of chapters) {
    nodes.push({
      id: chapter.id,
      position: { x: 0, y: nodeY },
      type: 'trainingModule',
      data: { title: chapter.title, chapterHead: true, status: chapter.status },
    });

    for (const training of chapter.trainings) {
      nodeY += 50;
      nodes.push({
        id: training.id,
        position: { x: 0, y: nodeY },
        type: 'trainingModule',
        data: {
          title: training.title,
          docPath: training.path,
          status: training.status,
        },
      });
    }

    nodeY += 100;
  }

  return nodes;
}

function generateEdges(chapters: TrainingChapter[]): Edge[] {
  const edges: Edge[] = [];

  // Create the edges between chapters
  for (const chapter of chapters) {
    if (!chapter.blockedBy) {
      continue;
    }
    const blockedBy = chapters.find(({ id }) => id === chapter.blockedBy);
    const lastModuleId = blockedBy.trainings.at(-1).id;
    edges.push({
      id: `${lastModuleId}-TO-${chapter.id}`,
      source: lastModuleId,
      target: chapter.id,
      type: 'straight',
    });
  }

  // Create the edges between modules
  for (const chapter of chapters) {
    if (!chapter.trainings) {
      continue;
    }

    for (const training of chapter.trainings) {
      const index = chapter.trainings.findIndex(({ id }) => id === training.id);
      const sourceId = index === 0 ? chapter.id : chapter.trainings[index - 1].id;
      edges.push({
        id: `${sourceId}-TO-${training.id}`,
        source: sourceId,
        target: training.id,
        type: 'straight',
      });
    }
  }

  return edges;
}

export function TrainingTree({ chapters }: TrainingTreeProps): ReactNode {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const nodeTypes = { trainingModule: TrainingModuleNode };

  const { userInfo } = useUser();

  useMemo(() => {
    setIsLoggedIn(userInfo != null);
  }, [userInfo]);

  useMemo(() => {
    setNodes(generateNodes(chapters));
    setEdges(generateEdges(chapters));
  }, [chapters]);

  return (
    <div>
      {isLoggedIn ? null : <LoginBanner />}
      <div className={styles.treeWrapper}>
        <ReactFlow edges={edges} fitView nodes={nodes} nodeTypes={nodeTypes} />
      </div>
    </div>
  );
}
