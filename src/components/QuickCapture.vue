<template>
  <div v-if="isOpen" class="quick-capture-overlay" @click="closeOnBackdrop">
    <div class="quick-capture-modal" @click.stop>
      <div class="quick-capture-header">
        <div class="header-title">
          <div class="header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div>
            <h3>Quick Capture</h3>
            <span class="header-shortcut"><kbd>⌘</kbd><kbd>N</kbd></span>
          </div>
        </div>
        <button @click="close" class="close-btn" title="Close (Esc)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="saveAndClose">
        <div class="form-group">
          <input
            ref="titleInput"
            v-model="quickNote.title"
            type="text"
            placeholder="What's on your mind?"
            class="quick-title-input"
          >
        </div>

        <div class="form-group">
          <textarea
            v-model="quickNote.content"
            placeholder="Start typing... Markdown is supported"
            class="quick-content-input"
            rows="8"
          ></textarea>
          <div class="textarea-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            <span>Supports Markdown formatting</span>
          </div>
        </div>

        <div class="quick-capture-footer">
          <div class="notebook-selector">
            <label class="selector-label">Save to:</label>
            <select v-model="quickNote.notebookId" class="notebook-select">
              <option v-for="nb in notebooks" :key="nb.id" :value="nb.id">
                {{ nb.emoji }} {{ nb.name }}
              </option>
            </select>
          </div>
          <div class="quick-actions">
            <button type="button" @click="close" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <path d="M17 21v-8H7v8M7 3v5h8"/>
              </svg>
              Save Note
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useStore } from '../stores/useStore.js';

const emit = defineEmits(['noteCreated']);

const store = useStore();
const isOpen = ref(false);
const titleInput = ref(null);

const quickNote = ref({
  title: '',
  content: '',
  notebookId: null
});

const notebooks = ref([]);

async function open() {
  isOpen.value = true;
  quickNote.value = {
    title: '',
    content: '',
    notebookId: store.state.currentNotebook?.id || store.state.notebooks[0]?.id
  };
  notebooks.value = store.state.notebooks;

  await nextTick();
  titleInput.value?.focus();
}

function close() {
  isOpen.value = false;
  quickNote.value = { title: '', content: '', notebookId: null };
}

function closeOnBackdrop(e) {
  if (e.target.classList.contains('quick-capture-overlay')) {
    close();
  }
}

async function saveAndClose() {
  try {
    const notebookId = quickNote.value.notebookId || store.state.notebooks[0]?.id;
    if (!notebookId) {
      alert('Please create a notebook first!');
      return;
    }

    const note = await store.createNote(
      notebookId,
      quickNote.value.title || 'Quick Note',
      quickNote.value.content
    );

    emit('noteCreated', note);
    close();
  } catch (error) {
    console.error('Failed to save quick note:', error);
  }
}

// Keyboard shortcut to open/close
function handleKeydown(e) {
  // Ctrl/Cmd + N to open quick capture
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  }
  // Escape to close
  if (e.key === 'Escape' && isOpen.value) {
    close();
  }
}

defineExpose({ open });

// Add global keyboard listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown);
}
</script>

<style scoped>
.quick-capture-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(28, 25, 23, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  z-index: 9999;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: overlayFade 0.2s ease;
}

@keyframes overlayFade {
  from { opacity: 0; backdrop-filter: blur(0); }
  to { opacity: 1; backdrop-filter: blur(8px); }
}

.quick-capture-modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 90%;
  max-width: 640px;
  box-shadow: var(--shadow-2xl);
  animation: modalSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlide {
  from {
    transform: translateY(-20px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Header */
.quick-capture-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-5);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  color: white;
}

.header-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.header-shortcut {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.header-shortcut kbd {
  padding: 2px 6px;
  font-size: 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-tertiary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--color-danger);
  transform: rotate(90deg);
}

.close-btn:active {
  transform: rotate(90deg) scale(0.95);
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.quick-title-input {
  padding: var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 18px;
  font-weight: 700;
  outline: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  caret-color: var(--color-primary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-title-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), var(--shadow-md);
  background: var(--color-bg-elevated);
}

.quick-title-input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.quick-title-input::selection {
  background: rgba(99, 102, 241, 0.2);
}

.quick-content-input {
  padding: var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-family: var(--font-sans);
  line-height: 1.7;
  resize: vertical;
  outline: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  min-height: 160px;
  caret-color: var(--color-primary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-content-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), var(--shadow-md);
  background: linear-gradient(180deg, var(--color-bg-elevated) 0%, rgba(99, 102, 241, 0.02) 100%);
}

.quick-content-input::placeholder {
  color: var(--color-text-tertiary);
}

.quick-content-input::selection {
  background: rgba(99, 102, 241, 0.2);
}

.textarea-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Footer */
.quick-capture-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.notebook-selector {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.selector-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.notebook-select {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.notebook-select:focus {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.quick-actions {
  display: flex;
  gap: var(--space-2);
}

.cancel-btn,
.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.cancel-btn {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.cancel-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.save-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  color: var(--color-text-inverse);
  border: none;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.save-btn:hover::before {
  left: 100%;
}

.save-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

/* Mobile */
@media (max-width: 768px) {
  .quick-capture-overlay {
    padding-top: var(--space-4);
    align-items: flex-start;
  }

  .quick-capture-modal {
    padding: var(--space-4);
    width: 95%;
    border-radius: var(--radius-lg);
  }

  .quick-capture-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .notebook-selector {
    width: 100%;
  }

  .quick-actions {
    width: 100%;
  }

  .quick-actions button {
    flex: 1;
  }
}
</style>
