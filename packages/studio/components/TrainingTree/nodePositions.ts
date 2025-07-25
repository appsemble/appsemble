import { type XYPosition } from 'reactflow';

/**
 * Defines where the chapters should be placed on the grid
 */
export const chapterNodes: { id: string; position: XYPosition }[] = [
  { id: 'introduction', position: { x: 0, y: 0 } },
  { id: 'how-to-create-an-app', position: { x: 0, y: 200 } },
  { id: 'data-flow', position: { x: 0, y: 500 } },
  { id: 'storing-data', position: { x: 0, y: 700 } },
  { id: 'data-transformation', position: { x: -200, y: 1050 } },
  { id: 'styling-apps', position: { x: 200, y: 1050 } },
  { id: 'basic-app', position: { x: 0, y: 1400 } },
];

/**
 * Defines the connections that get drawn between chapters
 */
export const chapterEdges: { from: string; to: string }[] = [
  { from: 'introduction', to: 'how-to-create-an-app' },
  { from: 'how-to-create-an-app', to: 'data-flow' },
  { from: 'data-flow', to: 'storing-data' },
  { from: 'storing-data', to: 'data-transformation' },
  { from: 'storing-data', to: 'styling-apps' },
  { from: 'styling-apps', to: 'basic-app' },
  { from: 'data-transformation', to: 'basic-app' },
];
