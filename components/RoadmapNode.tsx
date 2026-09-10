'use client';

import { useEffect, useRef, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useRoadmapStore, type RoadmapNodeData } from '@/store/useRoadmapStore';

const handles = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
];

export default function RoadmapNode({ id, data, selected }: NodeProps<Node<RoadmapNodeData>>) {
  const updateNode = useRoadmapStore((state) => state.updateNode);
  const tool = useRoadmapStore((state) => state.tool);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setTitle(data.title), [data.title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const saveTitle = () => {
    const next = title.trim() || 'Без названия';
    updateNode(id, { title: next });
    setTitle(next);
    setEditing(false);
  };

  const showHandles = tool === 'arrow' || selected;

  return (
    <div className={`roadmap-node ${data.completed ? 'is-completed' : ''} ${selected ? 'is-selected' : ''}`}>
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          className={showHandles ? '' : 'handle-hidden'}
          type="source"
          position={handle.position}
        />
      ))}

      {editing ? (
        <input
          ref={inputRef}
          className="nodrag roadmap-title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
          onKeyDown={(event) => {
            if (event.key === 'Enter') saveTitle();
            if (event.key === 'Escape') {
              setTitle(data.title);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span
          className="roadmap-title"
          onDoubleClick={(event) => {
            event.stopPropagation();
            setEditing(true);
          }}
        >
          {data.title}
        </span>
      )}
    </div>
  );
}
