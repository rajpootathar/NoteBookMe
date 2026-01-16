<template>
  <div class="note-editor">
    <div class="editor-header">
      <div class="header-left">
        <button @click="emit('goBack')" class="back-btn" title="Back to notes">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div class="header-center">
        <div class="save-indicator" :class="{ saving: isSaving, saved: showSavedIndicator }">
          <svg v-if="isSaving" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <svg v-else-if="showSavedIndicator" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span>{{ saveStatus }}</span>
        </div>
      </div>

      <div class="header-right">
        <button @click="toggleChat" class="header-btn ai" :class="{ active: showChat }" title="AI Chat & Transform">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </button>
        <button @click="saveNote" class="header-btn save" title="Save now">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <path d="M17 21v-8H7v8M7 3v5h8"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="title-section">
      <input
        v-model="localNote.title"
        @input="onTitleChange"
        class="note-title-input"
        placeholder="Untitled note..."
      >
      <div class="tags-section">
        <div class="tags-list">
          <span v-for="tag in localNote.tags" :key="tag" class="tag-chip">
            <span class="tag-text">{{ tag }}</span>
            <button @click="removeTag(tag)" class="tag-remove">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </span>
        </div>
        <input
          v-model="tagInput"
          @keydown="handleTagInput"
          class="tag-input"
          placeholder="Add tag..."
          type="text"
        >
      </div>
    </div>

    <div class="editor-body" :class="{ 'with-chat': showChat }">
      <MarkdownEditor
        ref="editorRef"
        v-model="localNote.content"
        @input="onContentChange"
      />
      <AIChat
        v-if="showChat"
        :noteId="localNote.id"
        :noteContent="localNote.content"
        :notes="[localNote]"
        @close="toggleChat"
        @updateNote="handleUpdateNote"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import MarkdownEditor from '../MarkdownEditor.vue';
import AIChat from '../AIChat.vue';
import { useStore } from '../../stores/useStore.js';
import { storage } from '../../services/storage.js';

const props = defineProps({
  noteId: String
});

const emit = defineEmits(['goBack']);

const store = useStore();
const localNote = ref({
  id: '',
  notebookId: '',
  title: '',
  content: '',
  tags: []
});

const showChat = ref(false);
const isSaving = ref(false);
const showSavedIndicator = ref(false);
const saveTimeout = ref(null);
const originalNote = ref(null);
const tagInput = ref('');
const editorRef = ref(null);

const saveStatus = ref('');

// Debounced auto-save
function scheduleAutoSave() {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  saveStatus.value = 'Typing...';
  isSaving.value = true;
  showSavedIndicator.value = false;

  saveTimeout.value = setTimeout(() => {
    autoSaveNote();
  }, 1000); // Auto-save after 1 second of no typing
}

async function autoSaveNote() {
  if (!localNote.value.id) return;

  isSaving.value = true;
  saveStatus.value = 'Saving...';

  try {
    // Convert reactive arrays to plain arrays for IndexedDB
    const tags = localNote.value.tags ? [...localNote.value.tags] : [];
    await store.updateNote(localNote.value.id, {
      title: localNote.value.title,
      content: localNote.value.content,
      tags: tags
    });
    originalNote.value = { ...localNote.value, tags: [...tags] };

    saveStatus.value = 'Saved';
    isSaving.value = false;
    showSavedIndicator.value = true;

    // Clear the "Saved" indicator after 2 seconds
    setTimeout(() => {
      showSavedIndicator.value = false;
      if (!isSaving.value) {
        saveStatus.value = '';
      }
    }, 2000);
  } catch (error) {
    console.error('Failed to auto-save note:', error);
    saveStatus.value = 'Error saving';
    isSaving.value = false;
  }
}

async function saveNote() {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }
  await autoSaveNote();
}


function handleTitleChange() {
  scheduleAutoSave();
}

function handleContentChange() {
  scheduleAutoSave();
}

async function createCheckpoint() {
  if (!localNote.value.id) return;
  
  try {
    saveStatus.value = 'Checkpointing...';
    await storage.createVersion(
      localNote.value.id, 
      localNote.value.content, 
      localNote.value.title
    );
    saveStatus.value = 'Version Saved';
    showSavedIndicator.value = true;
    setTimeout(() => {
      showSavedIndicator.value = false;
      saveStatus.value = '';
    }, 2000);
  } catch (error) {
    console.error('Failed to create checkpoint:', error);
    saveStatus.value = 'Checkpoint Failed';
  }
}

async function handleStartChat() {
  showChat.value = true;
}


async function handleUpdateNote({ type, content }) {
  // 1. Save current state as checkpoint before any AI modification
  await createCheckpoint();
  
  if (type === 'replace') {
    localNote.value.content = content;
  } else if (type === 'append') {
    const current = localNote.value.content || '';
    localNote.value.content = current + '\n\n' + content;
  } else if (type === 'insert') {
    // Attempt to insert at cursor via MarkdownEditor ref
    // We need a ref to the editor component
    const editorComponent = document.querySelector('.markdown-editor'); 
    // Ideally we usage a Vue ref, but let's assume we can get it or bind it.
    // In template: ref="editorRef"
    if (editorRef.value && editorRef.value.insertText) {
      editorRef.value.insertText(content);
      // Value update is handled by v-model event from editor
    } else {
      // Fallback to append if editor ref not available
      const current = localNote.value.content || '';
      localNote.value.content = current + '\n\n' + content;
    }
  }
  
  // 2. Save new state
  await saveNote();
  
  // 3. Notify user
  saveStatus.value = `Updated (${type})`;
  showSavedIndicator.value = true;
  setTimeout(() => {
    showSavedIndicator.value = false;
    saveStatus.value = '';
  }, 3000);
}

// ... existing functions ...


// ... existing functions ...

</script>

function handleTagInput(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addTag();
  } else if (e.key === 'Backspace' && !tagInput.value && localNote.value.tags?.length) {
    localNote.value.tags.pop();
    scheduleAutoSave();
  }
}

function addTag() {
  const tag = tagInput.value.trim().toLowerCase();
  if (tag && !localNote.value.tags?.includes(tag)) {
    if (!localNote.value.tags) {
      localNote.value.tags = [];
    }
    localNote.value.tags.push(tag);
    tagInput.value = '';
    scheduleAutoSave();
  }
}

function removeTag(tag) {
  localNote.value.tags = localNote.value.tags.filter(t => t !== tag);
  scheduleAutoSave();
}

async function loadNote() {
  if (props.noteId) {
    const note = await storage.getNote(props.noteId);
    if (note) {
      localNote.value = { ...note };
      originalNote.value = { ...note };
      saveStatus.value = 'Loaded';
      setTimeout(() => {
        saveStatus.value = '';
      }, 1000);
    }
  }
}

// Keyboard shortcuts
function handleKeydown(e) {
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveNote();
  }
  // Ctrl/Cmd + B for bold
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    const textarea = document.querySelector('.editor-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = localNote.value.content;
      const selected = text.substring(start, end);
      localNote.value.content = text.substring(0, start) + '**' + selected + '**' + text.substring(end);
      scheduleAutoSave();
    }
  }
}

watch(() => props.noteId, () => {
  loadNote();
});

onMounted(() => {
  loadNote();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }
  window.removeEventListener('keydown', handleKeydown);
  // Save when leaving the page
  if (localNote.value.id) {
    autoSaveNote();
  }
});
</script>

<style scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  background: var(--color-bg-elevated);
}

/* Header */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-light);
  gap: var(--space-4);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

/* Back Button */
.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn svg {
  transition: transform 0.2s ease;
}

.back-btn:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.back-btn:hover svg {
  transform: translateX(-3px);
}

/* Save Indicator */
.save-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
}

.save-indicator.saving {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.save-indicator.saved {
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Header Buttons */
.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.header-btn:active {
  transform: translateY(0);
}

.header-btn.ai {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-color: rgba(99, 102, 241, 0.3);
  color: var(--color-primary);
}

.header-btn.ai:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.header-btn.ai.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.header-btn.save {
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}

.header-btn.save:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--color-success);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

/* Title Section */
.title-section {
  padding: var(--space-6) var(--space-6);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-light);
}

.note-title-input {
  width: 100%;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  border: none;
  background: transparent;
  outline: none;
  padding: 0;
  margin-bottom: var(--space-4);
  color: var(--color-text-primary);
  caret-color: var(--color-primary);
  transition: color 0.2s ease;
}

.note-title-input:focus {
  background: linear-gradient(90deg, var(--color-text-primary) 0%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.note-title-input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.note-title-input::selection {
  background: rgba(99, 102, 241, 0.2);
  -webkit-text-fill-color: var(--color-text-primary);
}

/* Tags Section */
.tags-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-chip:nth-child(3n+1) {
  color: #6366f1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
}

.tag-chip:nth-child(3n+2) {
  color: #06b6d4;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%);
}

.tag-chip:nth-child(3n+3) {
  color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.12) 100%);
}

.tag-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-text {
  line-height: 1;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-remove:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
  transform: rotate(90deg);
}

.tag-input {
  flex: 1;
  min-width: 100px;
  max-width: 200px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  outline: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.tag-input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
  background: var(--color-bg-elevated);
}

.tag-input::placeholder {
  color: var(--color-text-tertiary);
}

/* Editor Body */
.editor-body {
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  flex-direction: row;
}

.editor-body.with-chat {
  display: grid;
  grid-template-columns: 1fr 420px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .editor-header {
    padding: var(--space-3) var(--space-4);
  }

  .back-btn span {
    display: none;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    justify-content: center;
  }

  .title-section {
    padding: var(--space-4);
  }

  .note-title-input {
    font-size: 22px;
    margin-bottom: var(--space-3);
  }

  .editor-body.with-chat {
    display: flex;
    flex-direction: column;
  }
}
</style>
