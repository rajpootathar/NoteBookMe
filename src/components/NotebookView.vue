<template>
  <div class="notebook-view">
    <!-- Sources Panel (Left) -->
    <div class="sources-panel" :class="{ collapsed: sourcesCollapsed }">
      <div class="panel-header">
        <h2>Sources</h2>
        <div class="header-actions">
          <button @click="createInlineNote" class="icon-btn" title="Add note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button @click="sourcesCollapsed = !sourcesCollapsed" class="icon-btn collapse-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="sources-content" v-if="!sourcesCollapsed">
        <!-- Chat Button - Chat with all notes -->
        <button
          class="chat-nav-btn"
          :class="{ active: !editingNoteId }"
          @click="closeEditor"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat</span>
        </button>

        <!-- Add Source Button with Drag & Drop -->
        <div
          class="add-source-zone"
          :class="{ 'drag-over': isDragging }"
          @click="createInlineNote"
          @dragover.prevent="handleDragOver"
          @dragleave="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <div class="drop-indicator" v-if="isDragging">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Drop to create note</span>
            <span class="drop-hint">txt, md, json, csv supported</span>
          </div>
          <div class="add-source-content" v-else>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Add source</span>
          </div>
        </div>

        <!-- Source Actions -->
        <div class="source-actions" v-if="notes.length > 0">
          <button @click="selectAllSources" class="text-btn">Select all</button>
          <button @click="deselectAllSources" class="text-btn">Clear</button>
        </div>

        <!-- Source List -->
        <div class="source-list">
          <div
            v-for="note in notes"
            :key="note.id"
            class="source-item"
            :class="{
              selected: selectedSources.has(note.id),
              editing: editingNoteId === note.id && viewMode === 'editor'
            }"
            @mouseenter="hoveredNoteId = note.id"
            @mouseleave="hoveredNoteId = null"
          >
            <label class="source-checkbox-wrapper" @click.stop>
              <input
                type="checkbox"
                :checked="selectedSources.has(note.id)"
                @change="toggleSource(note.id)"
                class="source-checkbox"
              >
              <span class="checkbox-custom"></span>
            </label>
            <div class="source-content" @click.stop="openNoteEditor(note)">
              <div class="source-icon" :class="getContentTypeClass(note)">
                <!-- Code icon -->
                <svg v-if="getContentType(note) === 'code'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                <!-- Checklist icon -->
                <svg v-else-if="getContentType(note) === 'checklist'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <!-- Link icon -->
                <svg v-else-if="getContentType(note) === 'link'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <!-- Meeting icon -->
                <svg v-else-if="getContentType(note) === 'meeting'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <!-- Idea icon -->
                <svg v-else-if="getContentType(note) === 'idea'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18h6"/>
                  <path d="M10 22h4"/>
                  <path d="M12 2a7 7 0 0 0-4 12.9V17h8v-2.1A7 7 0 0 0 12 2z"/>
                </svg>
                <!-- Default document icon -->
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div class="source-info">
                <span class="source-title">{{ note.title || 'Untitled' }}</span>
                <span class="source-preview">{{ getPreview(note.content) }}</span>
                <div class="source-tags" v-if="note.tags && note.tags.length > 0">
                  <span v-for="tag in note.tags.slice(0, 2)" :key="tag" class="source-tag">{{ tag }}</span>
                  <span v-if="note.tags.length > 2" class="source-tag-more">+{{ note.tags.length - 2 }}</span>
                </div>
              </div>
            </div>
            <button class="source-menu" @click.stop="openSourceMenu(note, $event)" title="More options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>

            <!-- Hover Preview -->
            <div v-if="hoveredNoteId === note.id && note.content && !contextMenuNote" class="source-hover-preview">
              <div class="preview-content">{{ getFullPreview(note.content) }}</div>
            </div>
          </div>

          <!-- Context Menu -->
          <Teleport to="body">
            <div
              v-if="contextMenuNote"
              class="context-menu-overlay"
              @click="closeContextMenu"
            >
              <div
                class="context-menu"
                :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
                @click.stop
              >
                <button class="context-menu-item" @click="editNoteFromMenu(contextMenuNote)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit</span>
                </button>
                <button class="context-menu-item" @click="duplicateNote(contextMenuNote)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span>Duplicate</span>
                </button>
                <div class="context-menu-divider"></div>
                <button class="context-menu-item danger" @click="deleteNoteFromMenu(contextMenuNote)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </Teleport>

          <div v-if="notes.length === 0" class="empty-sources">
            <div class="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
              </svg>
            </div>
            <p>No sources yet</p>
            <button @click="createInlineNote" class="add-source-btn">Add your first note</button>
          </div>
        </div>

        <!-- Selected count -->
        <div class="sources-footer" v-if="notes.length > 0">
          <span>{{ selectedSources.size }} of {{ notes.length }} selected</span>
        </div>
      </div>
    </div>

    <!-- Content Panel (Center) -->
    <div class="content-panel">
      <!-- Editor Mode - When editing a note -->
      <template v-if="editingNoteId">
        <div class="editor-mode-container">
          <NoteEditor
            ref="noteEditorRef"
            :noteId="editingNoteId"
            :showBackButton="true"
            @goBack="closeEditor"
            @saved="onNoteSaved"
          />
        </div>
      </template>

      <!-- Chat Mode - Default view -->
      <template v-else>
        <div class="chat-panel">
          <div class="chat-header">
            <div class="chat-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Chat</span>
            </div>
            <span class="chat-subtitle">Ask questions about your sources</span>
          </div>

          <div class="chat-messages" ref="messagesContainer">
            <!-- Welcome state - NotebookLM style -->
            <div v-if="messages.length === 0 && !isLoading" class="welcome-state">
              <!-- Audio Overview - Hidden for now, enable when ready -->
              <div class="audio-overview-card" v-if="false && selectedSources.size > 0">
                <div class="audio-card-header">
                  <div class="audio-icon-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                  <div class="audio-card-info">
                    <h4>Audio Overview</h4>
                    <p>Generate a podcast-style discussion</p>
                  </div>
                </div>
                <button
                  class="audio-generate-btn"
                  @click="generateAudioOverview"
                  :disabled="isGeneratingAudio || selectedSources.size === 0"
                >
                  <template v-if="isGeneratingAudio">
                    <span class="spinner-mini"></span>
                    Generating...
                  </template>
                  <template v-else-if="audioScript">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Play Audio
                  </template>
                  <template v-else>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                    </svg>
                    Generate
                  </template>
                </button>
                <!-- Audio Player -->
                <div v-if="audioScript" class="audio-player-mini">
                  <button class="play-pause-btn" @click="toggleAudio">
                    <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  </button>
                  <div class="audio-progress-bar">
                    <div class="progress-fill" :style="{ width: audioProgress + '%' }"></div>
                  </div>
                  <span class="audio-time-display">{{ audioTime }}</span>
                </div>
              </div>

              <div class="notebook-guide">
                <div class="guide-header">
                  <div class="guide-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <div class="guide-text">
                    <h3>Notebook guide</h3>
                    <p>{{ selectedSources.size > 0 ? `${selectedSources.size} sources selected` : 'Select sources to get started' }}</p>
                  </div>
                </div>

                <div class="suggested-questions">
                  <p class="section-label">Suggested questions</p>
                  <button @click="askQuestion('Give me a summary of my sources')" class="question-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    Give me a summary of my sources
                  </button>
                  <button @click="askQuestion('What are the main topics covered?')" class="question-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    What are the main topics covered?
                  </button>
                  <button @click="askQuestion('What are the key takeaways?')" class="question-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 11 12 14 22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    What are the key takeaways?
                  </button>
                  <button @click="askQuestion('What questions should I be asking about this material?')" class="question-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    What questions should I be asking?
                  </button>
                </div>

                <!-- Generate Actions -->
                <div class="generate-actions" v-if="selectedSources.size > 0">
                  <p class="section-label">Generate content</p>
                  <div class="generate-buttons">
                    <button @click="generate('summary')" :disabled="isGenerating" class="gen-btn">
                      📋 Summary
                    </button>
                    <button @click="generate('faq')" :disabled="isGenerating" class="gen-btn">
                      ? FAQ
                    </button>
                    <button @click="generate('study-guide')" :disabled="isGenerating" class="gen-btn">
                      📖 Study Guide
                    </button>
                    <button @click="generate('outline')" :disabled="isGenerating" class="gen-btn">
                      📝 Outline
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Messages -->
            <div
              v-for="(msg, idx) in messages"
              :key="idx"
              :class="['message', msg.role]"
            >
              <div v-if="msg.role === 'assistant'" class="message-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-text">{{ msg.content }}</div>
                <div v-if="msg.sources && msg.sources.length" class="message-sources">
                  <button
                    v-for="src in msg.sources"
                    :key="src.noteId || src"
                    class="source-ref"
                    @click="scrollToSource(src.noteId || src)"
                  >
                    [{{ src.index || sources.indexOf(src) + 1 }}] {{ src.noteTitle || src }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="message assistant loading">
              <div class="message-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
            <form @submit.prevent="sendMessage" class="chat-form">
              <input
                v-model="userInput"
                type="text"
                placeholder="Ask about your sources..."
                :disabled="isLoading"
                ref="chatInput"
              >
              <button type="submit" :disabled="isLoading || !userInput.trim()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { marked } from 'marked';
import { useStore } from '../stores/useStore.js';
import { ragService } from '../services/ragService.js';
import { aiService } from '../services/ai.js';
import NoteEditor from './views/NoteEditor.vue';

const props = defineProps({
  notebookId: {
    type: String,
    default: null
  }
});

const store = useStore();

// Panel states
const sourcesCollapsed = ref(false);

// View mode: 'chat' for multi-source analysis, 'editor' for note editing
const viewMode = ref('chat');

// Sources - filter by notebookId if provided
const notes = computed(() => {
  if (props.notebookId) {
    return store.state.notes.filter(n => n.notebookId === props.notebookId);
  }
  return store.state.notes;
});
const selectedSources = ref(new Set());

// Chat
const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);
const chatInput = ref(null);

// Studio
const isGenerating = ref(false);
const generatedOutput = ref(null);
const generatedTitle = ref('');

// Audio Overview
const audioScript = ref(null);
const isGeneratingAudio = ref(false);
const isPlaying = ref(false);
const audioProgress = ref(0);
const audioTime = ref('0:00');
let speechSynthesis = null;
let currentUtterance = null;

// Note editing
const editingNoteId = ref(null);
const noteEditorRef = ref(null);
const chatExpanded = ref(false);
const messagesContainerMini = ref(null);

// Drag & drop
const isDragging = ref(false);
const hoveredNoteId = ref(null);

// Context menu
const contextMenuNote = ref(null);
const contextMenuPosition = ref({ x: 0, y: 0 });

// Auto-select sources when notes load
watch(notes, (newNotes) => {
  if (newNotes.length > 0 && selectedSources.value.size === 0) {
    newNotes.slice(0, 10).forEach(n => selectedSources.value.add(n.id));
  }
}, { immediate: true });

const renderedOutput = computed(() => {
  if (!generatedOutput.value) return '';
  return marked(generatedOutput.value);
});

function getPreview(content) {
  if (!content) return 'No content';
  return content.replace(/[#*_`\[\]]/g, '').slice(0, 50) + (content.length > 50 ? '...' : '');
}

function getFullPreview(content) {
  if (!content) return '';
  return content.replace(/[#*_`\[\]]/g, '').slice(0, 200) + (content.length > 200 ? '...' : '');
}

// Content type detection for icons
function getContentType(note) {
  const content = (note.content || '').toLowerCase();
  const title = (note.title || '').toLowerCase();
  const tags = note.tags || [];

  // Check for code content
  if (content.includes('```') || content.includes('function ') || content.includes('const ') || content.includes('import ')) {
    return 'code';
  }

  // Check for list/checklist
  if (content.includes('- [ ]') || content.includes('- [x]') || /^[-*]\s/m.test(content)) {
    return 'checklist';
  }

  // Check for URL/link content
  if (content.includes('http://') || content.includes('https://') || tags.includes('link') || tags.includes('url')) {
    return 'link';
  }

  // Check for meeting/notes
  if (title.includes('meeting') || title.includes('notes') || tags.includes('meeting')) {
    return 'meeting';
  }

  // Check for idea/brainstorm
  if (title.includes('idea') || tags.includes('idea') || tags.includes('brainstorm')) {
    return 'idea';
  }

  return 'document';
}

function getContentTypeClass(note) {
  return `type-${getContentType(note)}`;
}

// Drag & drop handlers
function handleDragOver(e) {
  isDragging.value = true;
  e.dataTransfer.dropEffect = 'copy';
}

function handleDragLeave() {
  isDragging.value = false;
}

async function handleDrop(e) {
  isDragging.value = false;

  // Handle text drop
  const text = e.dataTransfer.getData('text/plain');
  const html = e.dataTransfer.getData('text/html');

  if (text || html) {
    const content = text || html;
    // Extract title from first line or use "Dropped Content"
    const lines = content.split('\n').filter(l => l.trim());
    const title = lines[0]?.slice(0, 50) || 'Dropped Content';

    try {
      const newNote = await store.createNote({
        title: title,
        content: content,
        tags: ['imported'],
        notebookId: props.notebookId || store.state.notebooks[0]?.id
      });

      if (newNote && newNote.id) {
        editingNoteId.value = newNote.id;
        viewMode.value = 'editor';
        selectedSources.value.add(newNote.id);
        selectedSources.value = new Set(selectedSources.value);
        await store.loadNotes();
      }
    } catch (error) {
      console.error('Failed to create note from drop:', error);
    }
    return;
  }

  // Handle file drop
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const supportedTextExts = ['.md', '.txt', '.json', '.csv', '.html', '.xml', '.yaml', '.yml'];
    const pendingServerProcess = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();

      // Check for text-based files we can read directly
      if (file.type.startsWith('text/') || supportedTextExts.includes(ext)) {
        const content = await file.text();
        const title = file.name.replace(/\.[^/.]+$/, '');
        const tags = ['imported', 'file'];

        // Add file type tag
        if (ext === '.md') tags.push('markdown');
        if (ext === '.json') tags.push('json');
        if (ext === '.csv') tags.push('csv');

        try {
          const newNote = await store.createNote({
            title: title,
            content: content,
            tags: tags,
            notebookId: props.notebookId || store.state.notebooks[0]?.id
          });

          if (newNote && newNote.id) {
            selectedSources.value.add(newNote.id);
            await store.loadNotes();
          }
        } catch (error) {
          console.error('Failed to create note from file:', error);
        }
      }
      // For PDF, DOC, XLSX - these need server-side processing
      else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.pptx'].includes(ext)) {
        pendingServerProcess.push(file.name);
      }
    }

    // Notify about files that need server processing
    if (pendingServerProcess.length > 0) {
      alert(`The following files need server-side processing (coming soon):\n${pendingServerProcess.join('\n')}\n\nCurrently supported: .txt, .md, .json, .csv, .html, .xml, .yaml`);
    }

    // Open the last created note
    await store.loadNotes();
    if (notes.value.length > 0) {
      const lastNote = notes.value[notes.value.length - 1];
      editingNoteId.value = lastNote.id;
      viewMode.value = 'editor';
    }
  }
}

function toggleSource(id) {
  if (selectedSources.value.has(id)) {
    selectedSources.value.delete(id);
  } else {
    selectedSources.value.add(id);
  }
  selectedSources.value = new Set(selectedSources.value);
}

function selectAllSources() {
  notes.value.forEach(n => selectedSources.value.add(n.id));
  selectedSources.value = new Set(selectedSources.value);
}

function deselectAllSources() {
  selectedSources.value.clear();
  selectedSources.value = new Set(selectedSources.value);
}

// View mode management
function setViewMode(mode) {
  viewMode.value = mode;
  if (mode === 'chat') {
    // Keep editingNoteId so we can return to it, but show chat
  }
}

// Create a new note inline (no modal)
async function createInlineNote() {
  try {
    const newNote = await store.createNote({
      title: '',
      content: '',
      tags: [],
      notebookId: props.notebookId || store.state.notebooks[0]?.id
    });

    if (newNote && newNote.id) {
      editingNoteId.value = newNote.id;
      viewMode.value = 'editor';

      // Add to selected sources
      selectedSources.value.add(newNote.id);
      selectedSources.value = new Set(selectedSources.value);

      // Reload notes to include the new one
      await store.loadNotes();

      // Focus on title input after a short delay
      await nextTick();
      setTimeout(() => {
        const titleInput = document.querySelector('.note-title-input');
        if (titleInput) {
          titleInput.focus();
        }
      }, 100);
    }
  } catch (error) {
    console.error('Failed to create note:', error);
  }
}

function editNote(note) {
  editingNoteId.value = note.id;
  viewMode.value = 'editor';
}

function openNoteEditor(note) {
  editingNoteId.value = note.id;
  viewMode.value = 'editor';
}

function closeEditor() {
  editingNoteId.value = null;
}

function onNoteSaved() {
  store.loadNotes();
}

function openSourceMenu(note, event) {
  event.stopPropagation();

  // Position the menu near the button
  const rect = event.target.closest('button').getBoundingClientRect();
  contextMenuPosition.value = {
    x: rect.left,
    y: rect.bottom + 4
  };
  contextMenuNote.value = note;
}

function closeContextMenu() {
  contextMenuNote.value = null;
}

async function duplicateNote(note) {
  closeContextMenu();
  try {
    const newNote = await store.createNote({
      title: `${note.title || 'Untitled'} (copy)`,
      content: note.content || '',
      tags: [...(note.tags || [])],
      notebookId: note.notebookId || props.notebookId
    });

    if (newNote && newNote.id) {
      selectedSources.value.add(newNote.id);
      selectedSources.value = new Set(selectedSources.value);
      await store.loadNotes();
    }
  } catch (error) {
    console.error('Failed to duplicate note:', error);
  }
}

async function deleteNoteFromMenu(note) {
  closeContextMenu();
  if (confirm(`Delete "${note.title || 'Untitled'}"? This cannot be undone.`)) {
    try {
      await store.deleteNote(note.id);
      selectedSources.value.delete(note.id);
      selectedSources.value = new Set(selectedSources.value);

      // If we were editing this note, close the editor
      if (editingNoteId.value === note.id) {
        editingNoteId.value = null;
      }

      await store.loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }
}

function editNoteFromMenu(note) {
  closeContextMenu();
  editNote(note);
}

function scrollToSource(noteId) {
  const element = document.querySelector(`[data-note-id="${noteId}"]`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('highlight');
    setTimeout(() => element.classList.remove('highlight'), 2000);
  }
}

async function askQuestion(question) {
  userInput.value = question;
  await sendMessage();
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isLoading.value) return;

  messages.value.push({ role: 'user', content: message });
  userInput.value = '';
  isLoading.value = true;

  await scrollToBottom();

  try {
    // Use only selected sources for context (like NotebookLM)
    const selectedNotes = notes.value.filter(n => selectedSources.value.has(n.id));

    let result;
    if (selectedNotes.length > 0) {
      // Build context from selected sources only
      const sourceContext = selectedNotes.map((note, i) =>
        `[Source ${i + 1}: "${note.title || 'Untitled'}"]\n${note.content}`
      ).join('\n\n---\n\n');

      const systemPrompt = `You are a helpful assistant that answers questions based ONLY on the provided sources.
Always cite your sources using [1], [2], etc. If the answer isn't in the sources, say so.

SOURCES:
${sourceContext}`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        ...messages.value.filter(m => m.role !== 'system').slice(-6),
        { role: 'user', content: message }
      ], { temperature: 0.7, maxTokens: 2000 });

      const sourcesUsed = selectedNotes.map((note, i) => ({
        index: i + 1,
        noteId: note.id,
        noteTitle: note.title || 'Untitled'
      }));

      result = { content: response, sources: sourcesUsed };
    } else if (notes.value.length > 0) {
      // No sources selected but notes exist - use all notes
      const allNotes = notes.value;
      const sourceContext = allNotes.slice(0, 5).map((note, i) =>
        `[Source ${i + 1}: "${note.title || 'Untitled'}"]\n${note.content}`
      ).join('\n\n---\n\n');

      const systemPrompt = `You are a helpful assistant that answers questions based on the provided sources.
Always cite your sources using [1], [2], etc. If the answer isn't in the sources, say so.

SOURCES:
${sourceContext}`;

      const response = await aiService.chat([
        { role: 'system', content: systemPrompt },
        ...messages.value.filter(m => m.role !== 'system').slice(-6),
        { role: 'user', content: message }
      ], { temperature: 0.7, maxTokens: 2000 });

      const sourcesUsed = allNotes.slice(0, 5).map((note, i) => ({
        index: i + 1,
        noteId: note.id,
        noteTitle: note.title || 'Untitled'
      }));

      result = { content: response, sources: sourcesUsed };
    } else {
      // No notes at all - general AI response
      const response = await aiService.chat([
        { role: 'system', content: 'You are a helpful assistant. The user has no notes yet. Encourage them to add some sources first.' },
        { role: 'user', content: message }
      ], { temperature: 0.7, maxTokens: 1000 });

      result = { content: response, sources: [] };
    }

    messages.value.push({
      role: 'assistant',
      content: result.content,
      sources: result.sources
    });
  } catch (error) {
    console.error('Chat error:', error);
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please check your AI API configuration in .env and try again.'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
    chatInput.value?.focus();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
  if (messagesContainerMini.value) {
    messagesContainerMini.value.scrollTop = messagesContainerMini.value.scrollHeight;
  }
}

const outputTemplates = {
  'faq': { title: 'FAQ', prompt: 'Generate a comprehensive FAQ with 8-12 questions and answers.' },
  'study-guide': { title: 'Study Guide', prompt: 'Create a study guide with key concepts, terms, and review questions.' },
  'summary': { title: 'Summary', prompt: 'Write an executive summary with overview, key points, and conclusions.' },
  'briefing': { title: 'Briefing', prompt: 'Create a professional briefing document with background, findings, and recommendations.' },
  'timeline': { title: 'Timeline', prompt: 'Create a timeline of events and developments.' },
  'outline': { title: 'Outline', prompt: 'Create a detailed hierarchical outline of the content.' }
};

async function generate(type) {
  if (selectedSources.value.size === 0) return;

  const template = outputTemplates[type];
  isGenerating.value = true;

  try {
    const selectedNotes = notes.value.filter(n => selectedSources.value.has(n.id));
    const sourceContent = selectedNotes.map((note, i) =>
      `[Source ${i + 1}: ${note.title || 'Untitled'}]\n${note.content}`
    ).join('\n\n---\n\n');

    const response = await aiService.chat([
      { role: 'system', content: 'You are a helpful assistant. Use markdown formatting. Be thorough but concise.' },
      { role: 'user', content: `${template.prompt}\n\nSources:\n${sourceContent}` }
    ], { maxTokens: 3000 });

    // Create a new note with the generated content
    const noteData = {
      title: template.title,
      content: response,
      tags: ['generated', type]
    };

    // Add to current notebook if we're in one
    if (props.notebookId) {
      noteData.notebookId = props.notebookId;
    }

    await store.createNote(noteData);
    await store.loadNotes();

    // Add a chat message to confirm
    messages.value.push({
      role: 'assistant',
      content: `Created "${template.title}" as a new source in your notebook.`
    });

  } catch (error) {
    console.error('Generation error:', error);
    messages.value.push({
      role: 'assistant',
      content: '**Error:** Failed to generate. Please try again.'
    });
  } finally {
    isGenerating.value = false;
  }
}

function copyOutput() {
  if (generatedOutput.value) {
    navigator.clipboard.writeText(generatedOutput.value);
  }
}

async function saveAsNote() {
  if (generatedOutput.value) {
    await store.createNote({
      title: generatedTitle.value,
      content: generatedOutput.value,
      tags: ['generated']
    });
    generatedOutput.value = null;
    await store.loadNotes();
  }
}

// Audio Overview functions
async function generateAudioOverview() {
  if (selectedSources.value.size === 0) return;

  isGeneratingAudio.value = true;

  try {
    const selectedNotes = notes.value.filter(n => selectedSources.value.has(n.id));
    const sourceContent = selectedNotes.map((note, i) =>
      `Source ${i + 1}: ${note.title || 'Untitled'}\n${note.content}`
    ).join('\n\n');

    const response = await aiService.chat([
      { role: 'system', content: `You are creating a podcast script. Write a conversational, engaging discussion between two hosts exploring the key topics.
Format as a dialogue:
HOST 1: [opening line]
HOST 2: [response]
...
Keep it informative yet casual. About 2-3 minutes when read aloud.` },
      { role: 'user', content: `Create a podcast overview of:\n\n${sourceContent}` }
    ], { maxTokens: 2000 });

    audioScript.value = response;
  } catch (error) {
    console.error('Audio generation error:', error);
  } finally {
    isGeneratingAudio.value = false;
  }
}

function toggleAudio() {
  if (!audioScript.value) return;

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    speechSynthesis = window.speechSynthesis;

    if (isPlaying.value) {
      speechSynthesis.cancel();
      isPlaying.value = false;
      audioProgress.value = 0;
      return;
    }

    currentUtterance = new SpeechSynthesisUtterance(audioScript.value);
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;

    const startTime = Date.now();
    const estimatedDuration = audioScript.value.length * 60; // rough estimate

    currentUtterance.onstart = () => {
      isPlaying.value = true;
    };

    currentUtterance.onend = () => {
      isPlaying.value = false;
      audioProgress.value = 100;
    };

    currentUtterance.onboundary = () => {
      const elapsed = Date.now() - startTime;
      audioProgress.value = Math.min(100, (elapsed / estimatedDuration) * 100);
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      audioTime.value = `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    speechSynthesis.speak(currentUtterance);
  }
}

// Handle keyboard events
function handleKeydown(e) {
  if (e.key === 'Escape' && contextMenuNote.value) {
    closeContextMenu();
  }
}

onMounted(async () => {
  await store.loadNotes();
  chatInput.value?.focus();
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.notebook-view {
  display: flex;
  height: 100%;
  background: var(--color-bg-secondary);
}

/* Sources Panel */
.sources-panel {
  width: 280px;
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.sources-panel.collapsed {
  width: 48px;
}

.sources-panel.collapsed .panel-header {
  flex-direction: column;
  padding: var(--space-2);
}

.sources-panel.collapsed .panel-header h2,
.sources-panel.collapsed .header-actions button:not(.collapse-btn) {
  display: none;
}

.sources-panel.collapsed .header-actions {
  width: 100%;
  justify-content: center;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.panel-header h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
}

.header-actions {
  display: flex;
  gap: var(--space-1);
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.collapse-btn svg {
  transition: transform 0.2s ease;
}

.sources-panel.collapsed .collapse-btn svg {
  transform: rotate(180deg);
}

.sources-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Chat Navigation Button */
.chat-nav-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-2) var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chat-nav-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.chat-nav-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.chat-nav-btn svg {
  flex-shrink: 0;
}

/* View Mode Toggle */
.view-mode-toggle {
  display: flex;
  gap: var(--space-1);
  margin: var(--space-3);
  padding: 4px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover:not(:disabled) {
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.05);
}

.mode-btn.active {
  background: var(--color-bg-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.mode-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Add Source Zone with Drag & Drop */
.add-source-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--space-2) var(--space-3) var(--space-2);
  padding: var(--space-3);
  background: transparent;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
}

.add-source-zone:hover {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.04);
}

.add-source-zone.drag-over {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  border-style: solid;
}

.add-source-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.add-source-zone:hover .add-source-content {
  color: var(--color-primary);
}

.add-source-content svg {
  transition: transform 0.2s ease;
}

.add-source-zone:hover .add-source-content svg {
  transform: scale(1.1);
}

.drop-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  animation: pulse-drop 1s ease-in-out infinite;
}

.drop-hint {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-tertiary);
}

@keyframes pulse-drop {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.source-actions {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.text-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.text-btn:hover {
  text-decoration: underline;
}

.source-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

/* Source Items - NotebookLM style */
.source-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: default;
  transition: all 0.15s ease;
  margin-bottom: var(--space-1);
  border: 1px solid transparent;
}

.source-item:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-light);
}

.source-item.selected {
  background: rgba(99, 102, 241, 0.06);
  border-color: rgba(99, 102, 241, 0.2);
}

.source-item.editing {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
}

/* Custom Checkbox */
.source-checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
}

.source-checkbox {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.source-checkbox:checked + .checkbox-custom {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.source-checkbox:checked + .checkbox-custom::after {
  content: '';
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.source-checkbox-wrapper:hover .checkbox-custom {
  border-color: var(--color-primary);
}

/* Source Content with Icon */
.source-content {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}

.source-content:hover {
  background: rgba(99, 102, 241, 0.08);
}

.source-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.source-item.selected .source-icon {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary);
}

/* File type icon colors */
.source-icon.type-code {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.source-icon.type-checklist {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.source-icon.type-link {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.source-icon.type-meeting {
  background: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;
}

.source-icon.type-idea {
  background: rgba(236, 72, 153, 0.12);
  color: #ec4899;
}

/* Source tags */
.source-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.source-tag {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.source-tag-more {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
}

/* Hover Preview */
.source-hover-preview {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: var(--space-2);
  width: 280px;
  max-height: 200px;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  overflow: hidden;
  animation: fadeIn 0.15s ease;
}

.preview-content {
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-5px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Context Menu - use :global because it's teleported to body */
:global(.context-menu-overlay) {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

:global(.context-menu) {
  position: fixed;
  min-width: 160px;
  background: var(--color-bg-elevated, #1a1a2e);
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  padding: 4px;
  z-index: 1001;
  animation: contextMenuFadeIn 0.15s ease;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:global(.context-menu-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #e5e5e5);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

:global(.context-menu-item:hover) {
  background: var(--color-bg-secondary, #252538);
}

:global(.context-menu-item svg) {
  color: var(--color-text-tertiary, #888);
  flex-shrink: 0;
}

:global(.context-menu-item:hover svg) {
  color: var(--color-text-secondary, #aaa);
}

:global(.context-menu-item.danger) {
  color: #ef4444;
}

:global(.context-menu-item.danger:hover) {
  background: rgba(239, 68, 68, 0.1);
}

:global(.context-menu-item.danger svg) {
  color: #ef4444;
}

:global(.context-menu-divider) {
  height: 1px;
  background: var(--color-border-light, #333);
  margin: 4px 0;
}

/* Position source-item relatively for hover preview */
.source-item {
  position: relative;
}

.source-info {
  flex: 1;
  min-width: 0;
}

.source-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.source-preview {
  display: block;
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.source-menu {
  opacity: 0;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.source-item:hover .source-menu {
  opacity: 1;
}

.source-menu:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.empty-sources {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.empty-icon {
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-3);
}

.empty-sources p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.add-source-btn {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.sources-footer {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border-light);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Content Panel - main area */
.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 400px;
  min-height: 0;
  overflow: hidden;
}

/* Editor Mode Container */
.editor-mode-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Note Content Area - when editing a note */
.note-content-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Expandable Chat Section - below note */
.chat-section {
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-light);
  transition: all 0.3s ease;
}

.chat-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.chat-toggle:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.chat-toggle .chevron {
  margin-left: auto;
  transition: transform 0.2s ease;
}

.chat-section.expanded .chat-toggle .chevron {
  transform: rotate(180deg);
}

.chat-expanded-content {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  border-top: 1px solid var(--color-border-light);
}

.chat-messages-mini {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 200px;
}

.chat-form-mini {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.chat-form-mini input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  outline: none;
}

.chat-form-mini input:focus {
  border-color: var(--color-primary);
}

.chat-form-mini button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
}

.chat-form-mini button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Chat Panel - full view when no note selected */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 400px;
  min-height: 0;
  overflow: hidden;
}

.chat-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.chat-subtitle {
  display: block;
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.welcome-state {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  gap: var(--space-4);
  height: 100%;
}

/* Audio Overview Card - NotebookLM signature feature */
.audio-overview-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  color: white;
}

.audio-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.audio-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  color: white;
}

.audio-card-info h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: white;
}

.audio-card-info p {
  margin: 2px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.audio-generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.audio-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.audio-generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-mini {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.audio-player-mini {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
}

.play-pause-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #1a1a2e;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-pause-btn:hover {
  transform: scale(1.1);
}

.audio-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  transition: width 0.3s ease;
}

.audio-time-display {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 35px;
  text-align: right;
}

/* Notebook Guide - NotebookLM style */
.notebook-guide {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.guide-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--space-4);
}

.guide-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: var(--radius-md);
  color: var(--color-primary);
}

.guide-text h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.guide-text p {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.suggested-questions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-2);
}

.question-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.question-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.question-btn svg {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.question-btn:hover svg {
  color: var(--color-primary);
}

.welcome-state h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.welcome-state p {
  margin: var(--space-2) 0 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
  max-width: 300px;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.quick-prompts button {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-prompts button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Messages - NotebookLM style */
.message {
  display: flex;
  gap: var(--space-3);
  max-width: 100%;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  color: white;
  flex-shrink: 0;
  font-size: 14px;
}

.message.user .message-avatar {
  display: none;
}

.message-content {
  max-width: 80%;
  line-height: 1.6;
}

.message.user .message-content {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-sm);
  font-size: 14px;
}

.message.assistant .message-content {
  background: transparent;
  padding: 0;
  max-width: 100%;
}

.message-text {
  font-size: 14px;
  white-space: pre-wrap;
  color: var(--color-text-primary);
  line-height: 1.7;
}

.message.user .message-text {
  color: white;
}

.message.assistant .message-text {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

/* Source citations - NotebookLM style */
.message-sources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.message-sources::before {
  content: 'Sources';
  display: block;
  width: 100%;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-1);
}

.source-ref {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.source-ref:hover {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

/* Typing indicator */
.typing-dots {
  display: flex;
  gap: 4px;
  padding: var(--space-3);
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Chat Input - NotebookLM style */
.chat-input-area {
  padding: var(--space-4) var(--space-6);
  background: linear-gradient(180deg, transparent 0%, var(--color-bg-primary) 20%);
  border-top: none;
}

.chat-form {
  display: flex;
  gap: var(--space-3);
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: var(--space-1);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.chat-form:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), var(--shadow-md);
}

.chat-form input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-full);
  font-size: 14px;
  background: transparent;
  outline: none;
}

.chat-form input::placeholder {
  color: var(--color-text-tertiary);
}

.chat-form button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.chat-form button:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.chat-form button:active:not(:disabled) {
  transform: scale(0.95);
}

.chat-form button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-text-tertiary);
}

/* Studio Panel */
.studio-panel-wrapper {
  width: 280px;
  min-width: 280px;
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.studio-panel-wrapper.collapsed {
  width: 48px;
  min-width: 48px;
}

.studio-header {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  color: white;
  min-height: 52px;
}

.studio-header h2 {
  color: white;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.2s ease;
}

.studio-panel-wrapper.collapsed .studio-header h2 {
  opacity: 0;
  width: 0;
}

.studio-header .icon-btn {
  color: white;
}

.studio-header .icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.studio-panel-wrapper.collapsed .collapse-btn svg {
  transform: rotate(180deg);
}

.studio-content {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

/* Audio Overview - NotebookLM signature feature */
.audio-overview-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.audio-header {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.audio-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  color: white;
}

.audio-info h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.audio-info p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.generate-audio-btn {
  width: 100%;
  padding: var(--space-3);
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-audio-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.generate-audio-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generating-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.audio-player {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}

.play-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-btn:hover {
  background: var(--color-primary-dark);
}

.audio-progress {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, #8b5cf6 100%);
  transition: width 0.3s ease;
}

.audio-time {
  font-size: 11px;
  color: var(--color-text-tertiary);
  min-width: 35px;
}

.close-audio {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.close-audio:hover {
  color: var(--color-text-primary);
}

.studio-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-4) 0;
}

.studio-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-4);
}

.studio-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.studio-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.studio-btn:hover:not(:disabled) {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}

.studio-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

.studio-btn span:last-child {
  font-size: 11px;
  font-weight: 500;
}

.generated-output {
  margin-top: var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-tertiary);
  font-size: 12px;
  font-weight: 600;
}

.output-actions {
  display: flex;
  gap: var(--space-1);
}

.output-actions button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
}

.output-actions button:hover {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.output-body {
  padding: var(--space-3);
  font-size: 13px;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
}

.generating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  color: var(--color-text-tertiary);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Note Modal */
.note-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.note-modal {
  width: 90%;
  max-width: 800px;
  height: 80vh;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Generated Output Panel */
.generated-output-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  z-index: 200;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.generated-output-panel .output-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.generated-output-panel .output-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

/* Note Editor styles removed - now inline */

/* Generate Actions in Welcome */
.generate-actions {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.generate-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.gen-btn {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.gen-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.gen-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 1024px) {
  .sources-panel {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .notebook-view {
    flex-direction: column;
  }
  .sources-panel {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
  .content-panel {
    min-height: 0;
    flex: 1;
  }
  .chat-panel {
    min-width: 0;
  }
  .note-content-area {
    min-height: 300px;
  }
  .chat-expanded-content {
    max-height: 200px;
  }
}
</style>
