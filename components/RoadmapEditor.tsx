'use client';

import { useCallback, useEffect } from 'react';
import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  SelectionMode,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
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

function EditorCanvas() {
  const {
    nodes,
    edges,
    tool,
    setNodes,
    setEdges,
    setTool,
    addNodeAt,
    addTextAt,
    selectNode,
    selectEdge,
    clearSelection,
    deleteSelection,
  } = useRoadmapStore();
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange<RoadmapNodeType>[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(
        addEdge(
          {
            ...connection,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 },
          },
          edges
        )
      );
      setTool('select');
    },
    [edges, setEdges, setTool]
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
          <span>локальная версия</span>
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
          selectionOnDrag={tool === 'select'}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={["Meta", "Shift"]}
          panOnDrag={tool === 'select' ? [1, 2] : true}
          panOnScroll
          deleteKeyCode={null}
          edgesReconnectable
          fitView
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
