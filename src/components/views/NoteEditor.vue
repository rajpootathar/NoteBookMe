<template>
  <div class="note-editor">
    <div class="editor-header">
      <div class="header-left">
        <button v-if="showBackButton" @click="emit('goBack')" class="back-btn" title="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="save-status-badge" :class="{ saving: isSaving, saved: showSavedIndicator, error: showErrorIndicator }">
          <svg v-if="isSaving" class="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <svg v-else-if="showSavedIndicator" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <svg v-else-if="showErrorIndicator" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          <span>{{ saveStatus }}</span>
        </div>
      </div>

      <div class="header-right">
        <button @click="toggleVersions" class="action-btn" :class="{ active: showVersions }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>History</span>
        </button>
        <button @click="toggleChat" class="action-btn ai-btn" :class="{ active: showChat }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <span>AI</span>
        </button>
      </div>
    </div>

    <div class="title-section">
      <input
        v-model="localNote.title"
        @input="handleTitleChange"
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
        @input="handleContentChange"
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

    <!-- Version History Panel -->
    <div v-if="showVersions" class="versions-panel">
      <div class="versions-header">
        <h3>History</h3>
        <button @click="closeVersionsPanel" class="versions-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="versions-actions">
        <button v-if="isPreviewingVersion" @click="cancelPreview" class="cancel-preview-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          Cancel preview
        </button>
        <button v-else @click="saveVersionManually" class="save-version-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Save current version
        </button>
      </div>

      <div class="versions-list">
        <div
          v-for="version in versions"
          :key="version.id"
          class="version-item"
        >
          <div class="version-info">
            <span class="version-date">{{ formatDate(version.createdAt) }}</span>
            <span class="version-preview">{{ version.title || 'Untitled' }}</span>
          </div>
          <div class="version-actions">
            <button @click="previewVersion(version)" class="version-action-btn" title="Load this version">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button @click="restoreVersion(version)" class="version-action-btn restore" title="Restore & save">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </button>
          </div>
        </div>
        <div v-if="versions.length === 0" class="no-versions">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>No versions yet</p>
          <span>Versions are auto-saved when leaving the note, using AI transforms, or manually via "Save current version"</span>
        </div>
      </div>
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
  noteId: String,
  showBackButton: {
    type: Boolean,
    default: false
  }
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
const showVersions = ref(false);
const versions = ref([]);
const isSaving = ref(false);
const showSavedIndicator = ref(false);
const showErrorIndicator = ref(false);
const saveTimeout = ref(null);
const originalNote = ref(null);
const tagInput = ref('');
const editorRef = ref(null);

const saveStatus = ref('');

// Version history tracking - Google Docs style
const versionSnapshot = ref({ content: '', title: '' }); // Content at last version save
const lastVersionTime = ref(0); // Timestamp of last version creation
const versionTimer = ref(null); // Timer for periodic version checks
const idleTimer = ref(null); // Timer for idle detection

// Version settings
const MIN_CHANGE_FOR_VERSION = 50; // Minimum chars changed to create version
const VERSION_INTERVAL_MS = 2 * 60 * 1000; // Create version every 2 minutes of editing
const IDLE_VERSION_DELAY_MS = 30 * 1000; // Create version after 30 seconds of inactivity

// Preview mode tracking
const isPreviewingVersion = ref(false);
const previewOriginal = ref({ content: '', title: '' }); // Content before preview started

// Undo stack for AI actions (separate from browser's native undo)
const undoStack = ref([]);
const MAX_UNDO_STACK = 20;

function pushToUndoStack() {
  undoStack.value.push({
    content: localNote.value.content,
    title: localNote.value.title,
    timestamp: Date.now()
  });
  // Limit stack size
  if (undoStack.value.length > MAX_UNDO_STACK) {
    undoStack.value.shift();
  }
}

function popFromUndoStack() {
  if (undoStack.value.length > 0) {
    const previous = undoStack.value.pop();
    localNote.value.content = previous.content;
    localNote.value.title = previous.title;
    saveStatus.value = 'Undone';
    showSavedIndicator.value = true;
    scheduleAutoSave();
    setTimeout(() => {
      showSavedIndicator.value = false;
      saveStatus.value = '';
    }, 1500);
    return true;
  }
  return false;
}

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
  scheduleIdleVersionCheck();
}

function handleContentChange() {
  scheduleAutoSave();
  scheduleIdleVersionCheck();
}

// Schedule version creation after idle period (Google Docs style)
function scheduleIdleVersionCheck() {
  // Clear existing idle timer
  if (idleTimer.value) {
    clearTimeout(idleTimer.value);
  }

  // Set new idle timer - creates version after inactivity
  idleTimer.value = setTimeout(async () => {
    if (hasSignificantChanges()) {
      console.log('Creating version after idle period');
      await createVersion(true);
    }
  }, IDLE_VERSION_DELAY_MS);
}

// Start periodic version check (creates version every X minutes while editing)
function startPeriodicVersionCheck() {
  if (versionTimer.value) return; // Already running

  versionTimer.value = setInterval(async () => {
    const timeSinceLastVersion = Date.now() - lastVersionTime.value;
    if (timeSinceLastVersion >= VERSION_INTERVAL_MS && hasSignificantChanges()) {
      console.log('Creating periodic version (2 min interval)');
      await createVersion(true);
    }
  }, 60 * 1000); // Check every minute
}

function stopPeriodicVersionCheck() {
  if (versionTimer.value) {
    clearInterval(versionTimer.value);
    versionTimer.value = null;
  }
  if (idleTimer.value) {
    clearTimeout(idleTimer.value);
    idleTimer.value = null;
  }
}

// Check if content changed enough to warrant a version
function hasSignificantChanges() {
  if (!versionSnapshot.value.content && !localNote.value.content) return false;
  const contentDiff = Math.abs((localNote.value.content || '').length - (versionSnapshot.value.content || '').length);
  const titleChanged = localNote.value.title !== versionSnapshot.value.title;

  // Also check actual text difference (not just length)
  const textChanged = localNote.value.content !== versionSnapshot.value.content;

  return textChanged && (contentDiff >= MIN_CHANGE_FOR_VERSION || titleChanged);
}

// Create a version (silent = no UI feedback)
async function createVersion(silent = false) {
  if (!localNote.value.id) {
    console.warn('createVersion: No note ID');
    return;
  }

  if (!localNote.value.content || localNote.value.content.trim().length === 0) {
    console.warn('createVersion: No content to save');
    return;
  }

  try {
    if (!silent) {
      saveStatus.value = 'Saving version...';
      showSavedIndicator.value = false;
    }

    console.log('Creating version for note:', localNote.value.id, 'content length:', localNote.value.content.length);

    const result = await storage.createVersion(
      localNote.value.id,
      localNote.value.content,
      localNote.value.title
    );

    console.log('Version created:', result);

    // Update snapshot and timestamp after creating version
    versionSnapshot.value = {
      content: localNote.value.content,
      title: localNote.value.title
    };
    lastVersionTime.value = Date.now();

    if (!silent) {
      saveStatus.value = 'Version saved';
      showSavedIndicator.value = true;
      showErrorIndicator.value = false;
      setTimeout(() => {
        showSavedIndicator.value = false;
        saveStatus.value = '';
      }, 2000);
    }

    // Reload versions if panel is open
    if (showVersions.value) {
      await loadVersions();
    }

    return result;
  } catch (error) {
    console.error('Failed to create version:', error);
    if (!silent) {
      saveStatus.value = 'Version failed: ' + (error.message || 'Unknown error');
      showSavedIndicator.value = false;
      showErrorIndicator.value = true;
      setTimeout(() => {
        showErrorIndicator.value = false;
        saveStatus.value = '';
      }, 3000);
    }
  }
}

// Create version when leaving note (if significant changes)
async function createVersionOnLeave() {
  if (!localNote.value.id) return;
  if (hasSignificantChanges()) {
    await createVersion(true);
  }
}

// Manual save version button
async function saveVersionManually() {
  console.log('saveVersionManually called, noteId:', localNote.value.id);
  console.log('Content length:', localNote.value.content?.length);

  if (!localNote.value.id) {
    saveStatus.value = 'No note to save';
    showErrorIndicator.value = true;
    setTimeout(() => {
      showErrorIndicator.value = false;
      saveStatus.value = '';
    }, 2000);
    return;
  }

  await createVersion(false);

  // Also reload versions list after manual save
  await loadVersions();
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

async function loadVersions() {
  if (localNote.value.id) {
    try {
      console.log('Loading versions for note:', localNote.value.id);
      const result = await storage.getVersions(localNote.value.id);
      console.log('Loaded versions:', result);
      versions.value = result || [];
    } catch (error) {
      console.error('Failed to load versions:', error);
      versions.value = [];
    }
  }
}

async function toggleVersions() {
  showVersions.value = !showVersions.value;
  if (showVersions.value) {
    saveStatus.value = 'Loading history...';
    await loadVersions();
    saveStatus.value = versions.value.length > 0
      ? `${versions.value.length} version(s)`
      : '';
    setTimeout(() => { saveStatus.value = ''; }, 1500);
  }
}

function previewVersion(version) {
  // Save original content before first preview
  if (!isPreviewingVersion.value) {
    previewOriginal.value = {
      content: localNote.value.content,
      title: localNote.value.title
    };
  }

  // Load preview content
  localNote.value.content = version.content;
  if (version.title) localNote.value.title = version.title;

  isPreviewingVersion.value = true;
  saveStatus.value = 'Previewing (click Cancel to discard)';
}

function cancelPreview() {
  if (!isPreviewingVersion.value) return;

  // Restore original content
  localNote.value.content = previewOriginal.value.content;
  localNote.value.title = previewOriginal.value.title;

  isPreviewingVersion.value = false;
  saveStatus.value = 'Preview cancelled';
  setTimeout(() => { saveStatus.value = ''; }, 1500);
}

function closeVersionsPanel() {
  // Cancel preview if active before closing
  if (isPreviewingVersion.value) {
    cancelPreview();
  }
  showVersions.value = false;
}

async function restoreVersion(version) {
  // If previewing, use the original content for version comparison
  const contentToSave = isPreviewingVersion.value
    ? previewOriginal.value
    : { content: localNote.value.content, title: localNote.value.title };

  // Save current (or original if previewing) as version first
  const contentDiff = Math.abs(contentToSave.content.length - versionSnapshot.value.content.length);
  if (contentDiff >= MIN_CHANGE_FOR_VERSION) {
    // Temporarily restore original to save it as version
    const tempContent = localNote.value.content;
    const tempTitle = localNote.value.title;
    localNote.value.content = contentToSave.content;
    localNote.value.title = contentToSave.title;
    await createVersion(true);
    localNote.value.content = tempContent;
    localNote.value.title = tempTitle;
  }

  // Now apply the restored version
  localNote.value.content = version.content;
  if (version.title) localNote.value.title = version.title;

  // Update snapshot to this restored version
  versionSnapshot.value = {
    content: version.content,
    title: version.title || localNote.value.title
  };

  // Clear preview state
  isPreviewingVersion.value = false;

  await saveNote();
  showVersions.value = false;
  saveStatus.value = 'Restored';
  setTimeout(() => { saveStatus.value = ''; }, 2000);
}

async function handleStartChat() {
  showChat.value = true;
}

function toggleChat() {
  showChat.value = !showChat.value;
}

async function handleUpdateNote({ type, content }) {
  // 1. Push current state to undo stack (for Ctrl+Z)
  pushToUndoStack();

  // 2. Save current state as version before any AI modification
  await createVersion(true);

  // 3. Apply the change
  if (type === 'replace') {
    localNote.value.content = content;
  } else if (type === 'append') {
    const current = localNote.value.content || '';
    localNote.value.content = current + '\n\n' + content;
  } else if (type === 'insert') {
    if (editorRef.value && editorRef.value.insertText) {
      editorRef.value.insertText(content);
    } else {
      const current = localNote.value.content || '';
      localNote.value.content = current + '\n\n' + content;
    }
  }

  // 4. Save new state
  await saveNote();

  // 5. Update snapshot to new content
  versionSnapshot.value = {
    content: localNote.value.content,
    title: localNote.value.title
  };

  saveStatus.value = 'AI applied (Ctrl+Z to undo)';
  showSavedIndicator.value = true;
  setTimeout(() => {
    showSavedIndicator.value = false;
    saveStatus.value = '';
  }, 3000);
}

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
  // Stop existing timers when loading new note
  stopPeriodicVersionCheck();

  if (props.noteId) {
    const note = await storage.getNote(props.noteId);
    if (note) {
      localNote.value = { ...note };
      originalNote.value = { ...note };

      // Set version snapshot (baseline for this editing session)
      versionSnapshot.value = {
        content: note.content || '',
        title: note.title || ''
      };
      lastVersionTime.value = Date.now(); // Reset version timer

      // Start periodic version check for this note
      startPeriodicVersionCheck();

      saveStatus.value = '';
    }
  }
}

// Keyboard shortcuts
function handleKeydown(e) {
  // Ctrl/Cmd + Z to undo AI actions (if we have items in our stack)
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    // Only intercept if we have AI actions to undo
    if (undoStack.value.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      popFromUndoStack();
      return;
    }
    // Otherwise let browser handle native undo
  }
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
  // Cancel preview and close panels when switching notes
  if (isPreviewingVersion.value) {
    isPreviewingVersion.value = false;
  }
  showVersions.value = false;
  showChat.value = false;
  loadNote();
});

onMounted(() => {
  loadNote();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(async () => {
  // Clean up all timers
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }
  stopPeriodicVersionCheck();
  window.removeEventListener('keydown', handleKeydown);

  // Save current content and create version if significant changes
  if (localNote.value.id) {
    await autoSaveNote();
    await createVersionOnLeave();
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
  /* Ensure editor body handles overlay */
  position: relative;
  overflow-x: hidden; 
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
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.back-btn svg {
  transition: transform 0.2s ease;
}

.back-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.back-btn:hover svg {
  transform: translateX(-2px);
}

/* Note Indicator (when no back button) */
.note-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-md);
  color: var(--color-primary);
}

.note-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Save Status Badge */
.save-status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
}

.save-status-badge.saving {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.save-status-badge.saved {
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

.save-status-badge.error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Action Buttons with Labels */
.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.action-btn.active {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn.ai-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-color: rgba(99, 102, 241, 0.2);
}

.action-btn.ai-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn.ai-btn.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  color: white;
  border-color: transparent;
}

/* Legacy Header Buttons (for compatibility) */
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

/* Version History Panel */
.versions-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  background: var(--color-bg-elevated);
  border-left: 1px solid var(--color-border);
  box-shadow: -4px 0 20px rgba(0,0,0,0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.versions-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.versions-header h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.versions-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.15s ease;
}

.versions-close:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.versions-actions {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
}

.save-version-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.save-version-btn:hover {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
  border-style: solid;
  color: var(--color-primary);
}

.cancel-preview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-preview-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.versions-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  margin-bottom: var(--space-1);
  border-radius: var(--radius-md);
  transition: background 0.15s ease;
}

.version-item:hover {
  background: var(--color-bg-secondary);
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.version-date {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.version-preview {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.version-item:hover .version-actions {
  opacity: 1;
}

.version-action-btn {
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-tertiary);
  border-radius: 4px;
}

.version-action-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.version-action-btn.restore:hover {
  color: var(--color-success);
}

.no-versions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-tertiary);
}

.no-versions svg {
  margin-bottom: var(--space-3);
  opacity: 0.5;
}

.no-versions p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.no-versions span {
  margin-top: var(--space-1);
  font-size: 11px;
  color: var(--color-text-tertiary);
  max-width: 180px;
}
</style>
