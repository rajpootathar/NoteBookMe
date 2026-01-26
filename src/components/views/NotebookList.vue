<template>
  <div class="notebook-list">
    <div class="notebook-header">
      <div class="header-left">
        <h1>{{ currentNotebook?.name || 'All Notes' }}</h1>
        <button @click="showNewNote = true" class="header-new-btn" title="New note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>New</span>
        </button>
      </div>
      <div class="header-right">
        <InstantSearch @openNote="openNote" />
      </div>
    </div>

    <div v-if="showGlobalAI" class="global-ai-panel">
      <GlobalAIChat
        :notes="allNotes"
        @close="showGlobalAI = false"
        @openNote="openNote"
        @createNote="createNoteFromAI"
      />
    </div>

    <div class="notes-container">
      <div class="notes-grid" v-if="filteredNotes.length > 0">
        <article
          v-for="(note, index) in filteredNotes"
          :key="note.id"
          class="note-card"
          @click="openNote(note.id)"
        >
          <div class="card-main">
            <div class="card-header">
              <h3 class="card-title">{{ note.title || 'Untitled' }}</h3>
              <div class="card-meta">
                <span v-if="note.favorite" class="card-star">★</span>
                <span class="card-date">{{ formatDate(note.updatedAt) }}</span>
              </div>
            </div>
            <p class="card-preview" v-if="note.content">{{ getPreview(note.content) }}</p>
            <p class="card-preview empty" v-else>No content yet...</p>
            <div class="card-tags" v-if="note.tags?.length">
              <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="card-tag">{{ tag }}</span>
              <span v-if="note.tags.length > 3" class="card-tag-more">+{{ note.tags.length - 3 }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button
              @click.stop="toggleFavorite(note.id)"
              class="card-action favorite"
              :class="{ active: note.favorite }"
              title="Add to favorites"
            >
              <svg v-if="note.favorite" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
            <button @click.stop="deleteNote(note.id)" class="card-action delete" title="Delete note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M12 18v-6M9 15h6"/>
          </svg>
        </div>
        <h3 class="empty-title">{{ searchQuery ? 'No results found' : 'Create your first note' }}</h3>
        <p class="empty-text">{{ searchQuery ? 'Try adjusting your search terms' : 'Capture ideas, take notes, and organize your thoughts with AI assistance' }}</p>
        <button v-if="!searchQuery" @click="showNewNote = true" class="empty-btn">
          Get started
        </button>
      </div>
    </div>

    <div v-if="showNewNotebook" class="modal-overlay" @click="showNewNotebook = false">
      <div class="modal" @click.stop>
        <h3>Create Notebook</h3>
        <form @submit.prevent="createNotebook">
          <input
            v-model="newNotebookName"
            type="text"
            placeholder="Notebook name..."
            required
          >
          <div class="emoji-selector">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              type="button"
              :class="{ active: newNotebookEmoji === emoji }"
              @click="newNotebookEmoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showNewNotebook = false">Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showNewNote" class="modal-overlay" @click="showNewNote = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M12 18v-6M9 15h6"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3>Create Note</h3>
            <p>Start capturing your thoughts</p>
          </div>
        </div>
        <form @submit.prevent="createNote">
          <div class="form-group">
            <label>Title</label>
            <input
              v-model="newNoteTitle"
              type="text"
              placeholder="Enter note title..."
              required
              autofocus
            >
          </div>
          <div class="modal-actions">
            <button type="button" @click="showNewNote = false">Cancel</button>
            <button type="submit">Create Note</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../../stores/useStore.js';
import InstantSearch from '../InstantSearch.vue';
import GlobalAIChat from '../GlobalAIChat.vue';

const props = defineProps({
  notebookId: String
});

const emit = defineEmits(['openNote']);

const store = useStore();
const searchQuery = ref('');
const showNewNotebook = ref(false);
const showNewNote = ref(false);
const showGlobalAI = ref(false);
const newNotebookName = ref('');
const newNotebookEmoji = ref('📓');
const newNoteTitle = ref('');

const emojis = ['📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '💡', '🎯', '🚀', '💼'];

const currentNotebook = computed(() => store.state.currentNotebook);
const filteredNotes = computed(() => {
  return store.notebookNotes.value;
});

const allNotes = computed(() => store.state.notes);
const favoriteNotes = ref([]);

async function loadFavorites() {
  favoriteNotes.value = await store.loadFavoriteNotes();
}

function openGlobalAI() {
  showGlobalAI.value = true;
}

function onSearch() {
  store.searchNotes(searchQuery.value);
}

function getPreview(content) {
  if (!content) return '';
  const cleaned = content.replace(/[#*`\[\]>\-]/g, '').replace(/\n+/g, ' ').trim();
  if (cleaned.length <= 100) return cleaned;
  return cleaned.substring(0, 100).trim() + '...';
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

async function createNotebook() {
  try {
    const notebook = await store.createNotebook(newNotebookName.value, newNotebookEmoji.value);
    showNewNotebook.value = false;
    newNotebookName.value = '';
    newNotebookEmoji.value = '📓';
  } catch (error) {
    console.error('Failed to create notebook:', error);
  }
}

async function createNote() {
  try {
    const notebookId = currentNotebook.value?.id || (store.state.notebooks[0]?.id);
    if (!notebookId) {
      alert('Please create a notebook first!');
      return;
    }
    const note = await store.createNote(notebookId, newNoteTitle.value);
    showNewNote.value = false;
    newNoteTitle.value = '';
    emit('openNote', note.id);
  } catch (error) {
    console.error('Failed to create note:', error);
  }
}

async function createNoteFromAI({ title, content, sources }) {
  try {
    const notebookId = currentNotebook.value?.id || (store.state.notebooks[0]?.id);
    if (!notebookId) {
      alert('Please create a notebook first!');
      return;
    }

    // Add sources as references at the end if available
    let noteContent = content;
    if (sources && sources.length > 0) {
      noteContent += '\n\n---\n\n**Sources:**\n';
      sources.forEach(source => {
        noteContent += `- [${source.index}] ${source.noteTitle || source.title}\n`;
      });
    }

    const note = await store.createNote({
      notebookId,
      title,
      content: noteContent
    });
    showGlobalAI.value = false;
    emit('openNote', note.id);
  } catch (error) {
    console.error('Failed to create note from AI:', error);
  }
}

async function deleteNote(noteId) {
  if (confirm('Are you sure you want to delete this note?')) {
    try {
      await store.deleteNote(noteId);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }
}

async function toggleFavorite(noteId) {
  try {
    await store.toggleFavorite(noteId);
    await loadNotes(props.notebookId);
    await loadFavorites();
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
}

function openNote(noteId) {
  emit('openNote', noteId);
}

onMounted(async () => {
  await store.loadNotebooks();
  await loadFavorites();
  if (props.notebookId) {
    const notebook = store.state.notebooks.find(n => n.id === props.notebookId);
    if (notebook) {
      store.setCurrentNotebook(notebook);
    }
  }
  await store.loadNotes(props.notebookId);
});
</script>

<style scoped>
.notebook-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  background: var(--color-bg-secondary);
}

/* Header */
.notebook-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  gap: var(--space-4);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-left h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
}

.header-new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: white;
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  position: relative;
  overflow: hidden;
}

.header-new-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.header-new-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
}

.header-new-btn:hover::before {
  opacity: 1;
}

.header-new-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.header-right {
  flex: 1;
  max-width: 320px;
}

/* Global AI Panel */
.global-ai-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-2xl);
  z-index: 1000;
  animation: slideInRight var(--transition-slow) ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Notes Container */
.notes-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-primary);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
  max-width: 1200px;
}

/* Note Card - Card Style */
.note-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  padding-left: calc(var(--space-4) + 4px);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--color-border-light);
  position: relative;
  min-height: 140px;
  overflow: hidden;
  animation: cardFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.note-card:nth-child(1) { animation-delay: 0.05s; }
.note-card:nth-child(2) { animation-delay: 0.1s; }
.note-card:nth-child(3) { animation-delay: 0.15s; }
.note-card:nth-child(4) { animation-delay: 0.2s; }
.note-card:nth-child(5) { animation-delay: 0.25s; }
.note-card:nth-child(6) { animation-delay: 0.3s; }

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.note-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.note-card:hover::before {
  opacity: 1;
}

.note-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
  transform: translateY(-3px);
}

.note-card:nth-child(3n+1)::before {
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
}

.note-card:nth-child(3n+2)::before {
  background: linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%);
}

.note-card:nth-child(3n+3)::before {
  background: linear-gradient(180deg, #f59e0b 0%, #ef4444 100%);
}

.card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.card-star {
  color: var(--color-accent);
  font-size: 12px;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.card-date {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  background: var(--color-bg-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
}

.note-card:hover .card-date {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.card-preview {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  position: relative;
  transition: color 0.2s ease;
}

.note-card:hover .card-preview {
  color: var(--color-text-primary);
}

.card-preview.empty {
  color: var(--color-text-tertiary);
  font-style: italic;
  background: linear-gradient(90deg, var(--color-text-tertiary) 0%, rgba(148, 163, 184, 0.5) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: var(--space-3);
}

.card-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
  position: relative;
}

/* Tag color variants based on position */
.card-tag:nth-child(3n+1) {
  color: #6366f1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
}

.card-tag:nth-child(3n+2) {
  color: #06b6d4;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%);
}

.card-tag:nth-child(3n+3) {
  color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.12) 100%);
}

.card-tag::before {
  content: '#';
  font-weight: 600;
  opacity: 0.7;
}

.note-card:hover .card-tag:nth-child(3n+1) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
}

.note-card:hover .card-tag:nth-child(3n+2) {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
}

.note-card:hover .card-tag:nth-child(3n+3) {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%);
}

.card-tag-more {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.note-card:hover .card-tag-more {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.card-actions {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transform: translateY(-4px);
  transition: all var(--transition-base);
}

.note-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.card-action:hover {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transform: scale(1.1);
  box-shadow: var(--shadow-sm);
}

.card-action:active {
  transform: scale(0.95);
}

.card-action.favorite {
  color: var(--color-text-tertiary);
}

.card-action.favorite:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.card-action.favorite.active {
  background: rgba(245, 158, 11, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.card-action.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.tag {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.tag-more {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  background: var(--color-bg-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  flex: 1;
  background: linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.empty-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 20px;
  color: white;
  margin-bottom: var(--space-5);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.25);
}

.empty-title {
  margin: 0 0 var(--space-2);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.empty-text {
  margin: 0 0 var(--space-5);
  font-size: 14px;
  color: var(--color-text-tertiary);
  max-width: 280px;
  line-height: 1.5;
}

.empty-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.empty-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.empty-btn:hover::before {
  left: 100%;
}

.empty-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 28px rgba(99, 102, 241, 0.45);
}

.empty-btn:active {
  transform: translateY(-1px) scale(1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(28, 25, 23, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--transition-base) ease;
}

.modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 90%;
  max-width: 440px;
  box-shadow: var(--shadow-2xl), 0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: var(--radius-lg);
  color: white;
  flex-shrink: 0;
}

.modal-header-text h3 {
  margin: 0 0 var(--space-1);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-header-text p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.modal h3 {
  margin: 0 0 var(--space-5);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.modal input {
  padding: 14px var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 500;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  caret-color: var(--color-primary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.modal input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), var(--shadow-md);
  background: var(--color-bg-elevated);
}

.modal input::selection {
  background: rgba(99, 102, 241, 0.2);
}

.emoji-selector {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.emoji-selector button {
  padding: var(--space-2);
  width: 44px;
  height: 44px;
  border: 2px solid transparent;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.emoji-selector button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.emoji-selector button:hover {
  border-color: var(--color-primary-light);
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.emoji-selector button:hover::before {
  opacity: 1;
}

.emoji-selector button.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  transform: scale(1.05);
}

.emoji-selector button.active::before {
  opacity: 1;
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
  margin-top: var(--space-2);
}

.modal-actions button {
  padding: 10px 20px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-base);
  color: var(--color-text-secondary);
}

.modal-actions button:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.modal-actions button:active {
  transform: translateY(0);
}

.modal-actions button:last-child {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  color: var(--color-text-inverse);
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.modal-actions button:last-child::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.modal-actions button:last-child:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}

.modal-actions button:last-child:hover::before {
  left: 100%;
}

.modal-actions button:last-child:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

/* Skeleton Loading */
.skeleton-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-border-light);
  min-height: 140px;
  overflow: hidden;
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-title {
  height: 20px;
  width: 70%;
  margin-bottom: var(--space-3);
}

.skeleton-text {
  height: 14px;
  width: 100%;
  margin-bottom: var(--space-2);
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-tags {
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-3);
}

.skeleton-tag {
  height: 22px;
  width: 60px;
  border-radius: var(--radius-full);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty State Animation */
.empty-icon {
  animation: floatIcon 3s ease-in-out infinite;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-state {
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

/* Mobile Responsive */
@media (max-width: 768px) {
  .notebook-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .header-actions {
    justify-content: flex-end;
  }

  .action-btn span {
    display: none;
  }

  .action-btn {
    padding: var(--space-2);
    width: 40px;
    height: 40px;
    justify-content: center;
  }

  .search-wrapper {
    padding: var(--space-3) var(--space-4);
  }

  .notes-container {
    padding: var(--space-4);
  }

  .notes-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .global-ai-panel {
    width: 100%;
  }
}
</style>
