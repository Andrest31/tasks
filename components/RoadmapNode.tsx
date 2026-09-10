'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Handle, NodeResizer, Position, type Node, type NodeProps } from '@xyflow/react';
import { useRoadmapStore, type RoadmapNodeData } from '@/store/useRoadmapStore';

const handles = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
];

function formatDate(value?: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

export default function RoadmapNode({ id, data, selected }: NodeProps<Node<RoadmapNodeData>>) {
  const updateNode = useRoadmapStore((state) => state.updateNode);
  const updateNodeSize = useRoadmapStore((state) => state.updateNodeSize);
  const tool = useRoadmapStore((state) => state.tool);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const tone = useMemo(() => {
    if (data.completed) return 'tone-green';
    const sum = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ['tone-blue', 'tone-violet', 'tone-cyan'][sum % 3];
  }, [data.completed, id]);

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
  const showResizer = tool === 'select' && !editing;

  return (
    <div className="roadmap-node-wrap">
      <NodeResizer
        isVisible={showResizer}
        minWidth={270}
        minHeight={150}
        maxWidth={760}
        maxHeight={560}
        keepAspectRatio={false}
        handleClassName="roadmap-resize-handle"
        lineClassName="roadmap-resize-line"
        onResize={(_event, params) => {
          updateNodeSize(id, params.width, params.height);
        }}
        onResizeEnd={(_event, params) => {
          updateNodeSize(id, params.width, params.height);
        }}
      />

      <article className={`roadmap-node ${tone} ${data.completed ? 'is-completed' : ''} ${selected ? 'is-selected' : ''}`}>
        {handles.map((handle) => (
          <Handle
            key={handle.id}
            id={handle.id}
            className={showHandles ? '' : 'handle-hidden'}
            type="source"
            position={handle.position}
          />
        ))}

        <div className="roadmap-card-body">
          {editing ? (
            <textarea
              ref={inputRef}
              rows={3}
              className="nodrag roadmap-title-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={saveTitle}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  saveTitle();
                }
                if (event.key === 'Escape') {
                  setTitle(data.title);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <h3
              className="roadmap-title"
              onDoubleClick={(event) => {
                event.stopPropagation();
                setEditing(true);
              }}
            >
              {data.title}
            </h3>
          )}

          <p className={`roadmap-description ${data.description ? '' : 'is-empty'}`}>
            {data.description || 'Открой блок и добавь описание задачи…'}
          </p>
        </div>

        <footer className="roadmap-card-footer">
          <span className={`status-pill ${data.completed ? 'done' : ''}`}>
            <span className="status-check">{data.completed ? '✓' : ''}</span>
            {data.completed ? 'Выполнено' : 'Не выполнено'}
          </span>

          {data.dueDate ? (
            <span className="node-date-chip">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
              {formatDate(data.dueDate)}
            </span>
          ) : (
            <span className="node-date-empty">Без даты</span>
          )}

          <span className="node-more" aria-hidden="true">•••</span>
        </footer>
      </article>
    </div>
  );
}
