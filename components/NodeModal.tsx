'use client';

import { useEffect, useRef, useState } from 'react';
import { useRoadmapStore } from '@/store/useRoadmapStore';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function formatDate(value?: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

export default function NodeModal() {
  const { nodes, selectedNodeId, selectNode, updateNode, deleteNode } = useRoadmapStore();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const node = nodes.find((item) => item.id === selectedNodeId);

  useEffect(() => {
    if (!selectedNodeId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      selectNode(null);
    };

    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [selectedNodeId, selectNode]);

  if (!node || node.data.kind !== 'block') return null;

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if ('showPicker' in input) {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const handleDateChange = (value: string) => {
    updateNode(node.id, { dueDate: value });
    dateInputRef.current?.blur();
    setDatePickerKey((value) => value + 1);
  };

  return (
    <div className="modal-backdrop" onMouseDown={() => selectNode(null)}>
      <div className="modal note-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button
          className="icon-button modal-close"
          onClick={() => selectNode(null)}
          aria-label="Закрыть"
          title="Закрыть"
        >
          ×
        </button>

        <input
          className="modal-title-editor"
          value={node.data.title}
          onChange={(event) => updateNode(node.id, { title: event.target.value })}
          placeholder="Название блока"
          aria-label="Название блока"
        />

        <textarea
          className="modal-description-editor"
          value={node.data.description}
          onChange={(event) => updateNode(node.id, { description: event.target.value })}
          placeholder="Напиши здесь подробности, ссылки, заметки, критерии готовности..."
          aria-label="Подробности блока"
          autoFocus
        />

        <div className="modal-footer">
          <div className="modal-meta-actions">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={node.data.completed}
                onChange={(event) => updateNode(node.id, { completed: event.target.checked })}
              />
              <span>Выполнено</span>
            </label>

            <div className="date-control">
              <input
                key={datePickerKey}
                ref={dateInputRef}
                className="native-date-input"
                type="date"
                value={node.data.dueDate ?? ''}
                onChange={(event) => handleDateChange(event.target.value)}
                aria-label="Дата"
              />
              <button type="button" className={`date-button ${node.data.dueDate ? 'has-date' : ''}`} onClick={openDatePicker}>
                <CalendarIcon />
                <span>{node.data.dueDate ? formatDate(node.data.dueDate) : 'Добавить дату'}</span>
              </button>
              {node.data.dueDate && (
                <button
                  type="button"
                  className="date-clear-button"
                  onClick={() => updateNode(node.id, { dueDate: '' })}
                  aria-label="Убрать дату"
                  title="Убрать дату"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <button className="delete-button" onClick={() => deleteNode(node.id)}>
            Удалить блок
          </button>
        </div>
      </div>
    </div>
  );
}
