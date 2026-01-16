<template>
  <div class="instant-search-container">
    <div class="search-input-wrapper" :class="{ focused: isInputFocused }">
      <span class="search-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </span>
      <input
        ref="searchInput"
        v-model="searchQuery"
        @input="onSearch"
        @focus="showResults = true; isInputFocused = true"
        @blur="isInputFocused = false"
        @keydown="handleKeydown"
        type="text"
        placeholder="Search notes..."
        class="search-input"
      >
      <span class="search-shortcut" v-if="!searchQuery && !isInputFocused">
        <kbd>⌘</kbd><kbd>K</kbd>
      </span>
      <button v-if="searchQuery" @click="clearSearch" class="clear-btn" title="Clear search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div v-if="showResults && (searchQuery || recentNotes.length)" class="search-results">
      <div v-if="isLoading" class="search-loading">
        <div class="loading-spinner"></div>
        <span>Searching...</span>
      </div>

      <div v-else-if="searchQuery && results.length === 0" class="no-results">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <path d="M8 8l6 6M14 8l-6 6"/>
        </svg>
        <p>No notes found for "{{ searchQuery }}"</p>
        <span class="no-results-hint">Try a different search term</span>
      </div>

      <div v-else-if="searchQuery && results.length > 0" class="results-list">
        <div class="results-section-header">
          <span class="results-section-title">Results</span>
          <span class="results-count">{{ results.length }} found</span>
        </div>
        <div
          v-for="(note, index) in results"
          :key="note.id"
          :class="['result-item', { active: selectedIndex === index }]"
          @click="openNote(note.id)"
        >
          <div class="result-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
          <div class="result-content">
            <div class="result-header">
              <span class="result-title">{{ note.title || 'Untitled' }}</span>
              <span class="result-notebook">{{ getNotebookName(note.notebookId) }}</span>
            </div>
            <div class="result-preview">{{ getPreview(note.content) }}</div>
            <div class="result-tags" v-if="note.tags?.length">
              <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="result-tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="recent-section">
        <div class="results-section-header">
          <span class="results-section-title">Recent</span>
        </div>
        <div
          v-for="(note, index) in recentNotes.slice(0, 5)"
          :key="note.id"
          :class="['result-item', { active: selectedIndex === index }]"
          @click="openNote(note.id)"
        >
          <div class="result-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="result-content">
            <div class="result-header">
              <span class="result-title">{{ note.title || 'Untitled' }}</span>
              <span class="result-notebook">{{ getNotebookName(note.notebookId) }}</span>
            </div>
            <div class="result-preview">{{ getPreview(note.content) }}</div>
          </div>
        </div>
      </div>

      <div class="search-footer">
        <span class="footer-hint">
          <kbd>↑</kbd><kbd>↓</kbd> to navigate
          <kbd>↵</kbd> to open
          <kbd>esc</kbd> to close
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useStore } from '../stores/useStore.js';

const emit = defineEmits(['openNote']);

const store = useStore();
const searchQuery = ref('');
const results = ref([]);
const recentNotes = ref([]);
const showResults = ref(false);
const isLoading = ref(false);
const selectedIndex = ref(-1);
const searchInput = ref(null);
const searchTimeout = ref(null);
const isInputFocused = ref(false);

const notebooks = computed(() => store.state.notes);

function getNotebookName(notebookId) {
  const nb = store.state.notebooks.find(n => n.id === notebookId);
  return nb ? `${nb.emoji} ${nb.name}` : 'Unknown';
}

function getPreview(content) {
  if (!content) return 'No content';
  return content.replace(/[#*`\[\]]/g, '').substring(0, 80) + '...';
}

async function onSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  if (!searchQuery.value.trim()) {
    results.value = [];
    loadRecentNotes();
    return;
  }

  isLoading.value = true;

  // Instant search - debounce by 200ms
  searchTimeout.value = setTimeout(async () => {
    const query = searchQuery.value.toLowerCase();
    const allNotes = await storage.getAllNotes();

    results.value = allNotes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );

    selectedIndex.value = -1;
    isLoading.value = false;
  }, 200);
}

function loadRecentNotes() {
  const allNotes = store.state.notes;
  recentNotes.value = allNotes
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);
}

function clearSearch() {
  searchQuery.value = '';
  results.value = [];
  showResults.value = true;
  loadRecentNotes();
  searchInput.value?.focus();
}

function openNote(noteId) {
  emit('openNote', noteId);
  showResults.value = false;
  searchQuery.value = '';
  results.value = [];
}

function handleKeydown(e) {
  const items = searchQuery.value ? results.value : recentNotes.value;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = Math.min(selectedIndex.value + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
  } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
    e.preventDefault();
    openNote(items[selectedIndex.value].id);
  } else if (e.key === 'Escape') {
    showResults.value = false;
  }
}

// Global keyboard shortcut (Ctrl+K / Cmd+K)
function handleGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.value?.focus();
    showResults.value = true;
    loadRecentNotes();
  }
}

// Close when clicking outside
function handleClickOutside(e) {
  if (!e.target.closest('.instant-search-container')) {
    showResults.value = false;
  }
}

onMounted(() => {
  loadRecentNotes();
  window.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  window.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('click', handleClickOutside);
});

// Import storage
import { storage } from '../services/storage.js';
</script>

<style scoped>
.instant-search-container {
  position: relative;
  width: 100%;
  max-width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 10px var(--space-4);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
}

.search-input-wrapper:hover {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-sm);
}

.search-input-wrapper.focused,
.search-input-wrapper:focus-within {
  background: var(--color-bg-elevated);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), var(--shadow-md);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: var(--space-2);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.search-input-wrapper:hover .search-icon {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.search-input-wrapper.focused .search-icon,
.search-input-wrapper:focus-within .search-icon {
  background: var(--color-primary);
  color: white;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: var(--color-text-primary);
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.search-shortcut {
  display: flex;
  gap: 4px;
  margin-left: var(--space-3);
}

.search-shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-tertiary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--color-danger);
  transform: rotate(90deg);
}

/* Search Results Dropdown */
.search-results {
  position: absolute;
  top: calc(100% + var(--space-2));
  left: 0;
  right: 0;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: 480px;
  overflow-y: auto;
  z-index: 1000;
  border: 1px solid var(--color-border-light);
  animation: dropdownSlide var(--transition-base) ease;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading State */
.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-6);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(99, 102, 241, 0.15);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-tertiary);
}

.no-results p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.no-results-hint {
  font-size: 13px;
}

/* Results Section Header */
.results-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 1;
}

.results-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

.results-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Result Items */
.recent-section,
.results-list {
  padding: var(--space-2) 0;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  animation: resultSlide 0.2s ease forwards;
  opacity: 0;
}

@keyframes resultSlide {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.result-item:nth-child(1) { animation-delay: 0ms; }
.result-item:nth-child(2) { animation-delay: 30ms; }
.result-item:nth-child(3) { animation-delay: 60ms; }
.result-item:nth-child(4) { animation-delay: 90ms; }
.result-item:nth-child(5) { animation-delay: 120ms; }

.result-item:hover,
.result-item.active {
  background: linear-gradient(90deg, var(--color-primary-subtle) 0%, transparent 100%);
  border-left-color: var(--color-primary);
  transform: translateX(4px);
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
}

.result-item:hover .result-icon,
.result-item.active .result-icon {
  background: var(--color-primary);
  color: white;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-notebook {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.result-preview {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-tags {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.result-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
}

.result-tag::before {
  content: '#';
  font-weight: 700;
  opacity: 0.7;
  margin-right: 1px;
}

.result-tag:nth-child(3n+1) {
  color: #6366f1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
}

.result-tag:nth-child(3n+2) {
  color: #06b6d4;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%);
}

.result-tag:nth-child(3n+3) {
  color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.12) 100%);
}

.result-item:hover .result-tag {
  transform: translateY(-1px);
}

/* Footer */
.search-footer {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.footer-hint kbd {
  padding: 2px 5px;
  font-size: 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  margin-right: 2px;
}

/* Mobile */
@media (max-width: 768px) {
  .search-results {
    max-height: 60vh;
  }

  .search-shortcut {
    display: none;
  }

  .search-footer {
    display: none;
  }
}
</style>
