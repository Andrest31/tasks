'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Edge, Node, Viewport } from '@xyflow/react';

export type RoadmapNodeData = {
  kind: 'block' | 'text';
  title: string;
  description: string;
  completed: boolean;
  text: string;
  dueDate?: string;
};

export type RoadmapNode = Node<RoadmapNodeData>;
export type ToolMode = 'select' | 'block' | 'text' | 'arrow';

type RoadmapState = {
  nodes: RoadmapNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  tool: ToolMode;
  viewport: Viewport;
  hasHydrated: boolean;
  setNodes: (nodes: RoadmapNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setTool: (tool: ToolMode) => void;
  setViewport: (viewport: Viewport) => void;
  setHasHydrated: (value: boolean) => void;
  addNodeAt: (position: { x: number; y: number }) => void;
  addTextAt: (position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  updateNode: (id: string, patch: Partial<RoadmapNodeData>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  deleteSelection: () => void;
};

const initialNodes: RoadmapNode[] = [
  {
    id: '1',
    type: 'roadmap',
    position: { x: 120, y: 140 },
    style: { width: 310, height: 170 },
    data: {
      kind: 'block',
      title: 'Первый блок',
      description: 'Один клик открывает подробности. Дважды по названию — переименование прямо на холсте.',
      completed: false,
      text: '',
      dueDate: '',
    },
  },
];

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set) => ({
      nodes: initialNodes,
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      tool: 'select',
      viewport: { x: 0, y: 0, zoom: 1 },
      hasHydrated: false,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setTool: (tool) => set({ tool }),
      setViewport: (viewport) => set({ viewport }),
      setHasHydrated: (value) => set({ hasHydrated: value }),

      addNodeAt: (position) =>
        set((state) => ({
          nodes: [
            ...state.nodes,
            {
              id: crypto.randomUUID(),
              type: 'roadmap',
              position,
              style: { width: 310, height: 170 },
              data: {
                kind: 'block',
                title: 'Новый блок',
                description: '',
                completed: false,
                text: '',
                dueDate: '',
              },
            },
          ],
          tool: 'select',
        })),

      addTextAt: (position) =>
        set((state) => ({
          nodes: [
            ...state.nodes,
            {
              id: crypto.randomUUID(),
              type: 'text',
              position,
              data: {
                kind: 'text',
                title: '',
                description: '',
                completed: false,
                text: 'Текст',
                dueDate: '',
              },
            },
          ],
          tool: 'select',
        })),

      selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
      clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

      updateNode: (id, patch) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, ...patch } } : node
          ),
        })),

      deleteNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        })),

      deleteEdge: (id) =>
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== id),
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        })),

      deleteSelection: () =>
        set((state) => {
          const selectedNodeIds = new Set(
            state.nodes.filter((node) => node.selected || node.id === state.selectedNodeId).map((node) => node.id)
          );
          const selectedEdgeIds = new Set(
            state.edges.filter((edge) => edge.selected || edge.id === state.selectedEdgeId).map((edge) => edge.id)
          );

          if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return {};

          return {
            nodes: state.nodes.filter((node) => !selectedNodeIds.has(node.id)),
            edges: state.edges.filter(
              (edge) =>
                !selectedEdgeIds.has(edge.id) &&
                !selectedNodeIds.has(edge.source) &&
                !selectedNodeIds.has(edge.target)
            ),
            selectedNodeId: null,
            selectedEdgeId: null,
          };
        }),
    }),
    {
      name: 'personal-roadmap-v1',
      partialize: (state) => ({
        nodes: state.nodes.map((node) => ({ ...node, selected: false })),
        edges: state.edges.map((edge) => ({ ...edge, selected: false })),
        viewport: state.viewport,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
