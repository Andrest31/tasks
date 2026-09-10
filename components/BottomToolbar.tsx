'use client';

import { useRoadmapStore, type ToolMode } from '@/store/useRoadmapStore';

function IconSelect() {
  return <svg viewBox="0 0 24 24"><path d="M6 3l11 8-6 1.5L9.5 19 6 3z" /></svg>;
}
function IconBlock() {
  return <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2" /></svg>;
}
function IconText() {
  return <svg viewBox="0 0 24 24"><path d="M5 5h14M12 5v14M8.5 19h7" /></svg>;
}
function IconArrow() {
  return <svg viewBox="0 0 24 24"><path d="M5 17L19 7M13 7h6v6" /></svg>;
}
function IconTrash() {
  return <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
}

export default function BottomToolbar() {
  const tool = useRoadmapStore((state) => state.tool);
  const setTool = useRoadmapStore((state) => state.setTool);
  const deleteSelection = useRoadmapStore((state) => state.deleteSelection);
  const hasSelection = useRoadmapStore(
    (state) =>
      Boolean(state.selectedNodeId || state.selectedEdgeId) ||
      state.nodes.some((node) => node.selected) ||
      state.edges.some((edge) => edge.selected)
  );

  const toolButton = (mode: ToolMode, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      className={`toolbar-button ${tool === mode ? 'is-active' : ''}`}
      onClick={() => setTool(mode)}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="bottom-toolbar" aria-label="Инструменты roadmap">
      {toolButton('select', 'Выбор и групповое выделение', <IconSelect />)}
      {toolButton('block', 'Добавить блок', <IconBlock />)}
      {toolButton('text', 'Добавить текст', <IconText />)}
      {toolButton('arrow', 'Соединить стрелкой', <IconArrow />)}
      <div className="toolbar-divider" />
      <button
        type="button"
        className="toolbar-button danger"
        onClick={deleteSelection}
        disabled={!hasSelection}
        aria-label="Удалить выбранное"
        title="Удалить выбранное (Delete / Backspace)"
      >
        <IconTrash />
      </button>
    </div>
  );
}
