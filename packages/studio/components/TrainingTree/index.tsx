import { type TrainingChapter } from '@appsemble/types';
import '@xyflow/react/dist/style.css';
import { type ReactNode, useMemo, useState } from 'react';
import { type Edge, type Node, ReactFlow } from 'reactflow';

import styles from './index.module.css';
import { LoginBanner } from './LoginBanner/index.js';
import { chapterEdges, chapterNodes } from './nodePositions.js';
import { TrainingModuleNode } from './TrainingModuleNode/index.js';
import { useUser } from '../UserProvider/index.js';

interface TrainingTreeProps {
  readonly chapters: TrainingChapter[];
}

function generateChapterContent(chapter: TrainingChapter): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const { position } = chapterNodes.find(({ id }) => id === chapter.id);
  let nodeY = position.y;
  // If nodes are too far to the left, ReactFlow won't render the edges
  const nodeX = position.x + 200;
  nodes.push({
    id: chapter.id,
    position: { x: nodeX, y: nodeY },
    type: 'trainingModule',
    data: { title: chapter.title, chapterHead: true, status: chapter.status },
  });

  for (const training of chapter.trainings) {
    nodeY += 50;
    const currentNodeIndex = nodes.push({
      id: training.id,
      position: { x: nodeX, y: nodeY },
      type: 'trainingModule',
      data: {
        title: training.title,
        docPath: training.path,
        status: training.status,
      },
    });
    const previousNode = nodes.at(currentNodeIndex - 2);
    edges.push({
      id: `${previousNode.id}-TO-${training.id}`,
      source: previousNode.id,
      target: training.id,
      type: 'straight',
    });
  }

  return { nodes, edges };
}

function generateTreeContent(chapters: TrainingChapter[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const chapter of chapters) {
    const chapterContent = generateChapterContent(chapter);
    nodes.push(...chapterContent.nodes);
    edges.push(...chapterContent.edges);

    const connection = chapterEdges.find(({ to }) => to === chapter.id);
    if (!connection) {
      continue;
    }

    // Draw edge between chapter head and last node of the parent chapter
    const finalNodeOfParent = chapters.find(({ id }) => id === connection.from).trainings.at(-1).id;
    edges.push({
      id: `${finalNodeOfParent}-TO-${chapter.id}`,
      source: finalNodeOfParent,
      target: chapter.id,
      type: 'straight',
    });
  }

  return { nodes, edges };
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
    const treeContent = generateTreeContent(chapters);
    setNodes(treeContent.nodes);
    setEdges(treeContent.edges);
  }, [chapters]);

  return (
    <div>
      {isLoggedIn ? null : <LoginBanner />}
      <div className={styles.treeWrapper}>
        <ReactFlow
          edges={edges}
          fitView
          nodes={nodes}
          nodeTypes={nodeTypes}
          panOnDrag={false}
          zoomOnScroll={false}
        />
      </div>
    </div>
  );
}
