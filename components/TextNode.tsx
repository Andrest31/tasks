'use client';

import { useEffect, useRef, useState } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { useRoadmapStore, type RoadmapNodeData } from '@/store/useRoadmapStore';

export default function TextNode({ id, data, selected }: NodeProps<Node<RoadmapNodeData>>) {
  const updateNode = useRoadmapStore((state) => state.updateNode);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setValue(data.text), [data.text]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = () => {
    const next = value.trim() || 'Текст';
    updateNode(id, { text: next });
    setValue(next);
    setEditing(false);
  };

  return (
    <div
      className={`text-node ${selected ? 'is-selected' : ''}`}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
    >
      {editing ? (
        <textarea
          ref={inputRef}
          rows={Math.max(1, value.split('\n').length)}
          className="nodrag nopan text-node-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') {
              setValue(data.text);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span>{data.text}</span>
      )}
    </div>
  );
}
