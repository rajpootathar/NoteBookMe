<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
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
      <button class="collapse-toggle" @click="toggleCollapse" :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
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
        <button class="add-notebook-btn" @click="$emit('addNotebook')" title="Create notebook">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      <div class="footer-actions">
        <button class="footer-btn" @click="$emit('openSettings')" title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
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
import { computed, onMounted, ref } from 'vue';
import { useStore } from '../stores/useStore.js';

const emit = defineEmits(['selectNotebook', 'addNotebook', 'logout', 'openSettings']);

const store = useStore();

const isCollapsed = ref(false);

const notebooks = computed(() => store.state.notebooks);
const notes = computed(() => store.state.notes);
const currentNotebook = computed(() => store.state.currentNotebook);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
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
  transition: width 0.2s ease;
}

.sidebar.collapsed {
  width: 56px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 52px;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.collapse-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.collapse-toggle svg {
  transition: transform 0.2s ease;
}

.sidebar.collapsed .collapse-toggle svg {
  transform: rotate(180deg);
}

/* Collapsed state */
.sidebar.collapsed .brand-name,
.sidebar.collapsed .nav-item span:not(.emoji),
.sidebar.collapsed .nav-section-title,
.sidebar.collapsed .add-notebook-btn,
.sidebar.collapsed .count,
.sidebar.collapsed .notebook-count {
  display: none;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: var(--space-3) var(--space-2);
  position: relative;
}

.sidebar.collapsed .brand {
  justify-content: center;
}

.sidebar.collapsed .collapse-toggle {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 8px;
}

.sidebar.collapsed .nav-section-header {
  justify-content: center;
  padding: var(--space-2) 0;
}

.sidebar.collapsed .footer-actions {
  flex-direction: column;
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
  width: 22px;
  height: 22px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 5px;
  cursor: pointer;
  color: #a5b4fc;
  transition: all 0.2s ease;
}

.add-notebook-btn:hover {
  background: rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.5);
  color: #c7d2fe;
  transform: scale(1.05);
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
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
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


</style>
