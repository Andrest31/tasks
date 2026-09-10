'use client';

import { useCallback, useEffect } from 'react';
import {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
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

const nodeTypes = { roadmap: RoadmapNode, text: TextNode };
type Side = 'top' | 'right' | 'bottom' | 'left';

function getNodeCenter(node: RoadmapNodeType) {
  const width = node.measured?.width ?? node.width ?? (node.type === 'roadmap' ? 300 : 120);
  const height = node.measured?.height ?? node.height ?? (node.type === 'roadmap' ? 165 : 36);
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 };
}

function getBestSides(source: RoadmapNodeType, target: RoadmapNodeType): [Side, Side] {
  const a = getNodeCenter(source); const b = getNodeCenter(target);
  const dx = b.x - a.x; const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

function autoAttachEdges(nodes: RoadmapNodeType[], edges: Edge[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return edges.map((edge) => {
    const source = nodeMap.get(edge.source); const target = nodeMap.get(edge.target);
    if (!source || !target) return edge;
    const [sourceHandle, targetHandle] = getBestSides(source, target);
    return edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle ? edge : { ...edge, sourceHandle, targetHandle };
  });
}

function AppMark() {
  return <div className="app-mark"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 15V9m0 0 3 2m-3-2 3-2m5 10V7" /></svg></div>;
}

function EditorCanvas() {
  const { nodes, edges, tool, viewport, hasHydrated, setNodes, setEdges, setTool, setViewport: saveViewport, addNodeAt, addTextAt, selectNode, selectEdge, clearSelection, deleteSelection } = useRoadmapStore();
  const { screenToFlowPosition, setViewport: setFlowViewport, zoomIn, zoomOut } = useReactFlow();

  useEffect(() => { if (hasHydrated) void setFlowViewport(viewport, { duration: 0 }); }, [hasHydrated, setFlowViewport, viewport]);

  const onNodesChange = useCallback((changes: NodeChange<RoadmapNodeType>[]) => {
    const nextNodes = applyNodeChanges(changes, nodes); setNodes(nextNodes); setEdges(autoAttachEdges(nextNodes, edges));
  }, [edges, nodes, setEdges, setNodes]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)), [edges, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    const nextEdges = addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }, style: { strokeWidth: 2 } }, edges);
    setEdges(autoAttachEdges(nodes, nextEdges)); setTool('select');
  }, [edges, nodes, setEdges, setTool]);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    if (tool === 'block') return addNodeAt(position);
    if (tool === 'text') return addTextAt(position);
    clearSelection();
  }, [addNodeAt, addTextAt, clearSelection, screenToFlowPosition, tool]);

  const onMoveEnd = useCallback((_event: MouseEvent | TouchEvent | null, nextViewport: Viewport) => saveViewport(nextViewport), [saveViewport]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelection(); }
      if (event.key === 'Escape') { setTool('select'); clearSelection(); }
    };
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearSelection, deleteSelection, setTool]);

  return (
    <main className={`app-shell tool-${tool}`}>
      <header className="topbar">
        <div className="brand-wrap">
          <AppMark />
          <div className="brand-copy"><strong>Personal Roadmap</strong><span>Build the life you want</span></div>
        </div>
        <div className="topbar-actions">
          <div className="save-indicator"><i />Сохранено</div>
          <div className="zoom-control">
            <button onClick={() => void zoomOut({ duration: 160 })} aria-label="Уменьшить">−</button>
            <span>{Math.round(viewport.zoom * 100)}%</span>
            <button onClick={() => void zoomIn({ duration: 160 })} aria-label="Увеличить">+</button>
          </div>
        </div>
      </header>

      <section className="canvas-wrap">
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onPaneClick={onPaneClick}
          onNodeClick={(_, node) => selectNode(node.id)} onEdgeClick={(_, edge) => selectEdge(edge.id)} onMoveEnd={onMoveEnd}
          connectionMode={ConnectionMode.Loose} selectionOnDrag={tool === 'select'} selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Meta', 'Shift']} panOnDrag={tool === 'select' ? [1, 2] : true} panOnScroll deleteKeyCode={null} edgesReconnectable
          defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 } }}
          minZoom={0.25} maxZoom={2}
        >
          <Background gap={28} size={1} color="rgba(139,129,190,.16)" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeStrokeWidth={2} />
        </ReactFlow>
      </section>
      <BottomToolbar />
      <NodeModal />
    </main>
  );
}

export default function RoadmapEditor() { return <ReactFlowProvider><EditorCanvas /></ReactFlowProvider>; }
