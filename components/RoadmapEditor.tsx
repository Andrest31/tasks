'use client';

import { useCallback, useEffect } from 'react';
import {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  SelectionMode,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import RoadmapNode from '@/components/RoadmapNode';
import TextNode from '@/components/TextNode';
import NodeModal from '@/components/NodeModal';
import BottomToolbar from '@/components/BottomToolbar';
import { useRoadmapStore, type RoadmapNode as RoadmapNodeType } from '@/store/useRoadmapStore';

const nodeTypes = {
  roadmap: RoadmapNode,
  text: TextNode,
};

type Side = 'top' | 'right' | 'bottom' | 'left';

function getNodeCenter(node: RoadmapNodeType) {
  const width = node.measured?.width ?? node.width ?? (node.type === 'roadmap' ? 200 : 120);
  const height = node.measured?.height ?? node.height ?? (node.type === 'roadmap' ? 60 : 36);

  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

function getBestSides(source: RoadmapNodeType, target: RoadmapNodeType): [Side, Side] {
  const a = getNodeCenter(source);
  const b = getNodeCenter(target);
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  }

  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

function autoAttachEdges(nodes: RoadmapNodeType[], edges: Edge[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return edge;

    const [sourceHandle, targetHandle] = getBestSides(source, target);
    if (edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) return edge;

    return { ...edge, sourceHandle, targetHandle };
  });
}

function EditorCanvas() {
  const {
    nodes,
    edges,
    tool,
    viewport,
    hasHydrated,
    setNodes,
    setEdges,
    setTool,
    setViewport: saveViewport,
    addNodeAt,
    addTextAt,
    selectNode,
    selectEdge,
    clearSelection,
    deleteSelection,
  } = useRoadmapStore();
  const { screenToFlowPosition, setViewport: setFlowViewport } = useReactFlow();

  useEffect(() => {
    if (!hasHydrated) return;
    void setFlowViewport(viewport, { duration: 0 });
  }, [hasHydrated, setFlowViewport]);

  const onNodesChange = useCallback(
    (changes: NodeChange<RoadmapNodeType>[]) => {
      const nextNodes = applyNodeChanges(changes, nodes);
      setNodes(nextNodes);
      setEdges(autoAttachEdges(nextNodes, edges));
    },
    [edges, nodes, setEdges, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge(
        {
          ...connection,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
        },
        edges
      );
      setEdges(autoAttachEdges(nodes, nextEdges));
      setTool('select');
    },
    [edges, nodes, setEdges, setTool]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      if (tool === 'block') {
        addNodeAt(position);
        return;
      }

      if (tool === 'text') {
        addTextAt(position);
        return;
      }

      clearSelection();
    },
    [addNodeAt, addTextAt, clearSelection, screenToFlowPosition, tool]
  );

  const onMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, nextViewport: Viewport) => saveViewport(nextViewport),
    [saveViewport]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (typing) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelection();
      }

      if (event.key === 'Escape') {
        setTool('select');
        clearSelection();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearSelection, deleteSelection, setTool]);

  return (
    <main className={`app-shell tool-${tool}`}>
      <header className="topbar">
        <div>
          <strong>Personal Roadmap</strong>
          <span>автосохранение включено</span>
        </div>
      </header>

      <section className="canvas-wrap">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onNodeClick={(_, node) => selectNode(node.id)}
          onEdgeClick={(_, edge) => selectEdge(edge.id)}
          onMoveEnd={onMoveEnd}
          connectionMode={ConnectionMode.Loose}
          selectionOnDrag={tool === 'select'}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Meta', 'Shift']}
          panOnDrag={tool === 'select' ? [1, 2] : true}
          panOnScroll
          deleteKeyCode={null}
          edgesReconnectable
        >
          <Background gap={24} size={1} />
          <Controls />
        </ReactFlow>
      </section>

      <BottomToolbar />
      <NodeModal />
    </main>
  );
}

export default function RoadmapEditor() {
  return (
    <ReactFlowProvider>
      <EditorCanvas />
    </ReactFlowProvider>
  );
}
