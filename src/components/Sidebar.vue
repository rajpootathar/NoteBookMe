<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="brand">
        <div class="brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <span class="brand-name">NotebookME</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div
        :class="['nav-item', { active: !currentNotebook }]"
        @click="selectNotebook(null)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
        </svg>
        <span>All Notes</span>
        <span class="count" v-if="notes.length">{{ notes.length }}</span>
      </div>

      <div class="nav-divider"></div>

      <div class="nav-section-header">
        <span class="nav-section-title">Notebooks</span>
        <button class="add-notebook-btn" @click="$emit('addNotebook')" title="Add notebook">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      <div
        v-for="notebook in notebooks"
        :key="notebook.id"
        :class="['nav-item notebook-item', { active: currentNotebook?.id === notebook.id }]"
        @click="selectNotebook(notebook)"
      >
        <span class="emoji">{{ notebook.emoji }}</span>
        <span class="notebook-name">{{ notebook.name }}</span>
        <span class="notebook-count" v-if="getNotebookCount(notebook.id)">{{ getNotebookCount(notebook.id) }}</span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="new-btn" @click="openQuickCapture">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        New note
      </button>
      <div class="footer-actions">
        <button class="footer-btn" @click="downloadExport" title="Export All Data">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <button class="footer-btn logout-btn" @click="$emit('logout')" title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from '../stores/useStore.js';

const emit = defineEmits(['selectNotebook', 'addNotebook', 'logout']);

const store = useStore();

const notebooks = computed(() => store.state.notebooks);
const notes = computed(() => store.state.notes);
const currentNotebook = computed(() => store.state.currentNotebook);

function openQuickCapture() {
  if (typeof window !== 'undefined' && window.openQuickCapture) {
    window.openQuickCapture();
  }
}

function getNotebookCount(notebookId) {
  return notes.value.filter(n => n.notebookId === notebookId).length;
}

async function selectNotebook(notebook) {
  store.setCurrentNotebook(notebook);
  await store.loadNotes(notebook?.id);
  emit('selectNotebook', notebook?.id);
}

async function deleteNotebook(notebookId) {
  if (notebooks.value.length <= 1) {
    alert('You need at least one notebook!');
    return;
  }

  const notebook = notebooks.value.find(n => n.id === notebookId);
  if (confirm(`Delete notebook "${notebook.name}" and all its notes?`)) {
    try {
      await store.deleteNotebook(notebookId);
      if (currentNotebook.value?.id === notebookId) {
        selectNotebook(null);
      }
    } catch (error) {
      console.error('Failed to delete notebook:', error);
    }
  }
}


async function downloadExport() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const response = await fetch('/api/export', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notebookme-export-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data');
    }
}

onMounted(async () => {
  await store.loadNotebooks();
  await store.loadNotes();

  if (notebooks.value.length === 0) {
    await store.createNotebook('My First Notebook', '📓');
    await store.loadNotebooks();
  }
});
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  background: #1e1e2e;
  height: 100%;
  flex-shrink: 0;
}

.sidebar-header {
  padding: var(--space-4) var(--space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 8px;
  color: white;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: var(--space-3) 0;
}

.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-2);
  margin-top: var(--space-1);
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.08em;
}

.add-notebook-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: all var(--transition-fast);
}

.add-notebook-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.notebook-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notebook-count {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
  transform: translateX(2px);
}

.nav-item:active {
  transform: translateX(0);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%);
  color: #c7d2fe;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 0 2px 2px 0;
}

.nav-item svg {
  flex-shrink: 0;
  opacity: 0.6;
  width: 16px;
  height: 16px;
  transition: all 0.2s ease;
}

.nav-item:hover svg {
  opacity: 0.9;
}

.nav-item.active svg {
  opacity: 1;
  color: #a5b4fc;
}

.nav-item .emoji {
  font-size: 15px;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-item:hover .emoji {
  background: rgba(255, 255, 255, 0.12);
  transform: scale(1.1);
}

.nav-item.active .emoji {
  background: rgba(99, 102, 241, 0.2);
}

.nav-item .count {
  margin-left: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.nav-item.active .count {
  background: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.sidebar-footer {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.footer-btn:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.footer-btn.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
  color: #c7d2fe;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.new-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.new-btn:hover::before {
  width: 200%;
  height: 200%;
}

.new-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.25) 100%);
  border-color: rgba(99, 102, 241, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.new-btn:active {
  transform: translateY(0);
}

.new-btn svg {
  transition: transform 0.3s ease;
}

.new-btn:hover svg {
  transform: rotate(90deg);
}

</style>
