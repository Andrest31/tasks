'use client';

import { useRoadmapStore } from '@/store/useRoadmapStore';

export default function NodeModal() {
  const { nodes, selectedNodeId, selectNode, updateNode, deleteNode } = useRoadmapStore();
  const node = nodes.find((item) => item.id === selectedNodeId);

  if (!node || node.data.kind !== 'block') return null;

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
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={node.data.completed}
              onChange={(event) => updateNode(node.id, { completed: event.target.checked })}
            />
            Выполнено
          </label>

          <button className="delete-button" onClick={() => deleteNode(node.id)}>
            Удалить блок
          </button>
        </div>
      </div>
    </div>
  );
}
