import { type ResourceReference } from '@appsemble/lang-sdk';
import ELK, { type ElkNode } from 'elkjs';
import { type OpenAPIV3 } from 'openapi-types';
import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  type Edge,
  type EdgeProps,
  getSmoothStepPath,
  Handle,
  internalsSymbol,
  MarkerType,
  type Node,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useStore,
} from 'reactflow';
import 'reactflow/dist/style.css';

import styles from './index.module.css';
import { useApp } from '../../../index.js';

const elk = new ELK.default();

export function ERD({ className }: { readonly className?: string }): ReactNode {
  const { app } = useApp();
  const resources = useMemo(() => app?.definition?.resources ?? {}, [app]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const nodeTypes = useMemo(() => ({ erdNode: ErdNode }), []);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const edgeTypes = useMemo(() => ({ relationshipEdge: RelationshipEdge }), []);

  const parseNodes = useMemo(
    () =>
      Object.entries(resources).map(
        ([key, resource]) =>
          ({
            id: key,
            type: 'erdNode',
            width: 100,
            height: 50,
            data: {
              resourceName: key,
              properties: Object.entries(resource.schema.properties),
              relationships: resource.references ?? {},
            },
          }) as Node,
      ),
    [resources],
  );

  const parseEdges = useMemo(
    () =>
      Object.entries(resources).flatMap(([key, resource], outerIndex) =>
        resource.references
          ? Object.entries(resource.references).map(
              ([name, relationship], innerIndex) =>
                ({
                  id: `${outerIndex}-${innerIndex}`,
                  source: key,
                  sourceHandle: name + relationship.resource,
                  target: relationship.resource,
                  type: 'relationshipEdge',
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: 'black',
                    width: 20,
                    height: 20,
                  },
                  style: {
                    stroke: 'black',
                    strokeWidth: 2,
                  },
                }) as Edge,
            )
          : [],
      ),
    [resources],
  );

  useEffect(() => {
    const layoutGraph = async (layoutNodes: Node[], LayoutEdges: Edge[]): Promise<any> => {
      const graph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.spacing.nodeNode': '250',
          'elk.layered.spacing.nodeNodeBetweenLayers': '250',
          'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.nodePlacement.strategy': 'SIMPLE',
        },
        children: layoutNodes.map((node) => ({
          id: node.id,
          width: node.width,
          height: node.height,
        })),
        edges: LayoutEdges.map((edge) => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
      };

      const layoutedGraph = await elk.layout(graph);

      return layoutedGraph.children.map((node, index: number) => ({
        ...layoutNodes.find((n: ElkNode) => n.id === node.id),
        position: { x: node.x + 5 * index, y: node.y },
      }));
    };

    const applyLayout = async (): Promise<void> => {
      const layoutNodes = await layoutGraph(parseNodes, parseEdges);
      setNodes(layoutNodes);
      setEdges(parseEdges);
    };

    applyLayout();
  }, [parseNodes, parseEdges, setNodes, setEdges]);

  return (
    <div className={className}>
      <ReactFlow
        edges={edges}
        edgeTypes={edgeTypes}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
      >
        <Background gap={12} size={1} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}

type Entry = [string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject];

interface NodeData {
  resourceName: string;
  properties: Entry[];
  relationships: Record<string, ResourceReference>;
}

function ErdNode({ data }: { readonly data: NodeData }): ReactNode {
  return (
    <div className={styles.erdNode}>
      <Handle
        isConnectable={false}
        position={Position.Left}
        style={{ top: 28, opacity: 0 }}
        type="target"
      />
      <Handle
        isConnectable={false}
        position={Position.Right}
        style={{ top: 28, opacity: 0 }}
        type="target"
      />
      <h1>{data.resourceName}</h1>
      <table>
        <tbody>
          {data.properties.map(([name, property], index) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{'type' in property ? property.type : null}</td>
              {data.relationships && data.relationships[name] ? (
                <Handle
                  id={name + data.relationships[name].resource}
                  isConnectable={false}
                  position={Position.Right}
                  style={{ top: 77.5 + 41 * index, opacity: 0 }}
                  type="source"
                />
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelationshipEdge({
  id,
  markerEnd,
  source,
  sourceHandleId,
  style,
  target,
}: EdgeProps): ReactNode {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const { sourcePos, sx, sy, targetPos, tx, ty } = getEdgeParams(
    sourceNode,
    targetNode,
    sourceHandleId as string,
  );

  const [edgePath] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
    borderRadius: 0,
  });

  return (
    <path
      className="react-flow__edge-path"
      d={edgePath}
      id={id}
      markerEnd={markerEnd}
      // eslint-disable-next-line react/forbid-dom-props
      style={style}
    />
  );
}

function getFixedSourceParams(
  sourceNode: Node<any, string>,
  sourceHandle: string,
): { x: number; y: number; position: Position } {
  const handle = sourceNode[internalsSymbol].handleBounds.source.find((h) => h.id === sourceHandle);

  const offsetX = handle!.width / 2;
  const offsetY = handle!.height / 2;

  const x = sourceNode.positionAbsolute!.x + handle!.x + offsetX;
  const y = sourceNode.positionAbsolute!.y + handle!.y + offsetY;

  return { x, y, position: handle!.position };
}

function getNodeCenter(node: Node<any, string>): { x: number; y: number } {
  return {
    x: node.positionAbsolute!.x + node.width! / 2,
    y: node.positionAbsolute!.y + node.height! / 2,
  };
}

function getHandleCoordsByPosition(
  node: Node<any, string>,
  handlePosition: Position,
): [number, number] {
  const handle = node[internalsSymbol].handleBounds.target.find(
    (h) => h.position === handlePosition,
  );

  let offsetX = handle!.width / 2;

  switch (handlePosition) {
    case Position.Left:
      offsetX = 0;
      break;
    case Position.Right:
      offsetX = handle!.width;
      break;
    default:
      break;
  }

  const x = node.positionAbsolute!.x + handle!.x + offsetX;
  const y = node.positionAbsolute!.y + handle!.y + handle!.height / 2;

  return [x, y];
}

function getParams(nodeA: Node<any, string>, nodeB: Node<any, string>): [number, number, Position] {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const position = centerA.x > centerB.x ? Position.Left : Position.Right;

  const [x, y] = getHandleCoordsByPosition(nodeA, position);
  return [x, y, position];
}

function getTargetParams(
  sourceNode: Node<any, string>,
  targetNode: Node<any, string>,
): { tx: number; ty: number; targetPosition: Position } {
  const [tx, ty, targetPosition] = getParams(targetNode, sourceNode);
  return { tx, ty, targetPosition };
}

function getEdgeParams(
  source: Node<any, string>,
  target: Node<any, string>,
  sourceHandle: string,
): {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
} {
  const { position: sourcePosition, x: sx, y: sy } = getFixedSourceParams(source, sourceHandle);
  const { targetPosition, tx, ty } = getTargetParams(source, target);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos: sourcePosition,
    targetPos: targetPosition,
  };
}
