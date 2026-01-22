<template>
  <div class="notebooks-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <span class="logo-text">NotebookME</span>
        </div>
      </div>
      <div class="header-right">
        <button class="user-menu" @click="$emit('logout')" title="Sign out">
          <span class="user-avatar">{{ userInitial }}</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-content">
        <!-- Welcome Section -->
        <section class="welcome-section">
          <h1>Welcome to NotebookME</h1>
          <p>Your AI-powered second brain. Create a notebook to get started.</p>
        </section>

        <!-- Create New Notebook -->
        <section class="notebooks-section">
          <div class="section-header">
            <h2>My Notebooks</h2>
          </div>

          <div class="notebooks-grid">
            <!-- Create New Card -->
            <button class="notebook-card create-card" @click="showCreateModal = true">
              <div class="create-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span class="create-text">Create new</span>
            </button>

            <!-- Notebook Cards -->
            <div
              v-for="notebook in notebooks"
              :key="notebook.id"
              class="notebook-card"
              @click="$emit('selectNotebook', notebook.id)"
            >
              <div class="card-emoji">{{ notebook.emoji || '📓' }}</div>
              <div class="card-content">
                <h3 class="card-title">{{ notebook.name }}</h3>
                <p class="card-meta">{{ getSourceCount(notebook.id) }} sources</p>
              </div>
              <button class="card-menu" @click.stop="openMenu(notebook, $event)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Create Notebook Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Create notebook</h3>
          <button class="modal-close" @click="showCreateModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="emoji-picker">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              :class="['emoji-btn', { selected: newNotebook.emoji === emoji }]"
              @click="newNotebook.emoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
          <input
            v-model="newNotebook.name"
            type="text"
            placeholder="Notebook name"
            class="modal-input"
            @keyup.enter="createNotebook"
            autofocus
          />
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreateModal = false">Cancel</button>
          <button class="btn-primary" @click="createNotebook" :disabled="!newNotebook.name.trim()">
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../stores/useStore.js';

const emit = defineEmits(['selectNotebook', 'logout']);

const store = useStore();

const notebooks = computed(() => store.state.notebooks);
const notes = computed(() => store.state.notes);

const showCreateModal = ref(false);
const newNotebook = ref({ name: '', emoji: '📓' });

const emojis = ['📓', '📚', '📝', '💡', '🎯', '🚀', '💼', '🔬', '📊', '🎨', '💻', '🧠'];

const userInitial = computed(() => {
  const username = localStorage.getItem('username') || 'U';
  return username.charAt(0).toUpperCase();
});

function getSourceCount(notebookId) {
  return notes.value.filter(n => n.notebookId === notebookId).length;
}

async function createNotebook() {
  if (!newNotebook.value.name.trim()) return;

  await store.createNotebook(newNotebook.value.name, newNotebook.value.emoji);
  await store.loadNotebooks();

  newNotebook.value = { name: '', emoji: '📓' };
  showCreateModal.value = false;
}

function openMenu(notebook, event) {
  // TODO: Add context menu for rename/delete
  if (confirm(`Delete notebook "${notebook.name}"?`)) {
    store.deleteNotebook(notebook.id);
  }
}

onMounted(async () => {
  await store.loadNotebooks();
  await store.loadNotes();
});
</script>

<style scoped>
.notebooks-dashboard {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
}

/* Header */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: white;
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  color: white;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.user-menu {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-radius: 50%;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

/* Main Content */
.dashboard-main {
  flex: 1;
  padding: var(--space-10) var(--space-8);
  display: flex;
  justify-content: center;
}

.dashboard-content {
  width: 100%;
  max-width: 900px;
}

.welcome-section {
  text-align: center;
  margin-bottom: var(--space-10);
  padding: var(--space-6) 0;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-section h1 {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3);
  letter-spacing: -0.02em;
}

.welcome-section p {
  font-size: 17px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Notebooks Section */
.notebooks-section {
  margin-bottom: var(--space-8);
}

.section-header {
  margin-bottom: var(--space-4);
}

.section-header h2 {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  margin: 0;
}

.notebooks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5);
}

/* Notebook Card */
.notebook-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 160px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.notebook-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
  transform: translateY(-4px);
}

.card-emoji {
  font-size: 40px;
  margin-bottom: var(--space-4);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.card-meta {
  font-size: 13px;
  color: var(--color-text-tertiary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.card-meta::before {
  content: '';
  width: 4px;
  height: 4px;
  background: var(--color-text-tertiary);
  border-radius: 50%;
  opacity: 0.5;
}

.card-menu {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: none;
  border: none;
  padding: var(--space-1);
  cursor: pointer;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all 0.15s ease;
}

.notebook-card:hover .card-menu {
  opacity: 1;
}

.card-menu:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

/* Create Card */
.create-card {
  border: 2px dashed var(--color-border);
  background: transparent;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.create-card:hover {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.04);
}

.create-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border-radius: 50%;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-3);
  transition: all 0.2s ease;
}

.create-card:hover .create-icon {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
}

.create-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.create-card:hover .create-text {
  color: var(--color-primary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 400px;
  box-shadow: var(--shadow-2xl);
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--space-5);
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.emoji-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.emoji-btn:hover {
  background: var(--color-bg-tertiary);
}

.emoji-btn.selected {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.modal-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  outline: none;
  transition: all 0.15s ease;
}

.modal-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border-light);
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary);
}

.btn-primary {
  padding: var(--space-2) var(--space-4);
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-main {
    padding: var(--space-4);
  }

  .welcome-section h1 {
    font-size: 24px;
  }

  .notebooks-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
