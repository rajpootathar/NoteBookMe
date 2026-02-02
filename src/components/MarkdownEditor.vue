<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-group">
          <button @click="insertMarkdown('**', '**')" title="Bold (Ctrl+B)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </button>
          <button @click="insertMarkdown('*', '*')" title="Italic (Ctrl+I)" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          <button @click="insertMarkdown('~~', '~~')" title="Strikethrough" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 7.2 3.3s7.2 1.8 7.2 3.3c0 2.9-2.7 3.6-5.3 3.6-1.8 0-3.9-.3-6.2-.9"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button @click="insertMarkdown('## ', '')" title="Heading" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12h8M4 18V6M12 18V6M17 10l3 2-3 2"/>
            </svg>
          </button>
          <button @click="insertMarkdown('- ', '')" title="Bullet List" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="4" cy="6" r="1" fill="currentColor"/>
              <circle cx="4" cy="12" r="1" fill="currentColor"/>
              <circle cx="4" cy="18" r="1" fill="currentColor"/>
            </svg>
          </button>
          <button @click="insertMarkdown('[', '](url)')" title="Link" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button @click="insertMarkdown('`', '`')" title="Inline Code" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="view-toggle">
          <button
            :class="['toggle-btn', { active: activeView === 'write' }]"
            @click="activeView = 'write'"
            title="Write mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Write
          </button>
          <button
            :class="['toggle-btn', { active: activeView === 'preview' }]"
            @click="activeView = 'preview'"
            title="Preview mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Preview
          </button>
          <button
            :class="['toggle-btn', { active: activeView === 'split' }]"
            @click="activeView = 'split'"
            title="Split view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="12" y1="3" x2="12" y2="21"/>
            </svg>
            Split
          </button>
        </div>
      </div>
    </div>

    <div class="editor-container" :class="[`view-${activeView}`]">
      <!-- Editor wrapper for ghost text overlay -->
      <div v-show="activeView !== 'preview'" class="editor-wrapper">
        <textarea
          ref="textarea"
          v-model="localContent"
          @input="onInput"
          @keydown="onKeydown"
          @scroll="onTextareaScroll"
          @blur="onBlur"
          placeholder="Start writing... Type / for commands"
          class="editor-textarea"
        ></textarea>

        <!-- Ghost text suggestion overlay -->
        <div
          v-if="suggestion && aiSettings.enabled"
          class="ghost-text-overlay"
          :style="ghostTextStyle"
        >
          <span class="ghost-text">{{ suggestion }}</span>
        </div>
      </div>

      <!-- Slash command menu -->
      <SlashCommandMenu
        ref="slashMenuRef"
        :visible="showSlashMenu"
        :position="slashMenuPosition"
        :filter="slashFilter"
        @select="onSlashCommand"
        @close="closeSlashMenu"
      />

      <!-- Simple divider with sync toggle -->
      <div v-if="activeView === 'split'" class="split-divider">
        <button
          :class="['sync-scroll-btn', { active: syncScroll }]"
          @click="toggleSyncAndAlign"
          :title="syncScroll ? 'Sync scroll ON' : 'Sync scroll OFF'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="syncScroll" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path v-if="syncScroll" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            <path v-if="!syncScroll" d="M18.84 5.16a4.5 4.5 0 0 0-6.36 0l-2.83 2.83"/>
            <path v-if="!syncScroll" d="M5.16 18.84a4.5 4.5 0 0 0 6.36 0l2.83-2.83"/>
            <line v-if="!syncScroll" x1="2" y1="2" x2="22" y2="22"/>
          </svg>
        </button>
      </div>

      <div
        v-show="activeView !== 'write'"
        ref="previewPane"
        class="editor-preview"
        v-html="renderedMarkdown"
        @scroll="onPreviewScroll"
      ></div>
    </div>

    <!-- Help Panel -->
    <HelpPanel />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import SlashCommandMenu from './SlashCommandMenu.vue';
import HelpPanel from './HelpPanel.vue';
import { suggestionService } from '../services/suggestionService.js';

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

// Core state
const localContent = ref(props.modelValue);
const textarea = ref(null);
const previewPane = ref(null);
const activeView = ref('write');
const syncScroll = ref(true);

// Slash command state
const showSlashMenu = ref(false);
const slashMenuPosition = ref({ top: 0, left: 0 });
const slashFilter = ref('');
const slashStartPos = ref(0);
const slashMenuRef = ref(null);

// AI suggestion state
const suggestion = ref('');
const suggestionPending = ref(false);
const ghostTextStyle = ref({});
const aiSettings = ref(suggestionService.getSettings());

// Debounce timers
let suggestionTimer = null;
let inputTimer = null;

// Load AI settings
function loadAISettings() {
  aiSettings.value = suggestionService.getSettings();
}

// Watch for settings changes
onMounted(() => {
  loadAISettings();
  window.addEventListener('storage', loadAISettings);
});

onUnmounted(() => {
  window.removeEventListener('storage', loadAISettings);
  if (suggestionTimer) clearTimeout(suggestionTimer);
  if (inputTimer) clearTimeout(inputTimer);
  suggestionService.cancelSuggestion();
});

const renderedMarkdown = computed(() => {
  return marked(localContent.value || '');
});

// ============ Scroll Sync ============
let scrollSource = null;
let rafId = null;

function onTextareaScroll() {
  if (!syncScroll.value || activeView.value !== 'split') return;
  if (scrollSource === 'preview') return;

  scrollSource = 'textarea';

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const ta = textarea.value;
    const preview = previewPane.value;
    if (!ta || !preview) return;

    const taMaxScroll = ta.scrollHeight - ta.clientHeight;
    if (taMaxScroll <= 0) return;

    const scrollPercent = ta.scrollTop / taMaxScroll;
    const previewMaxScroll = preview.scrollHeight - preview.clientHeight;

    if (previewMaxScroll > 0) {
      preview.scrollTop = scrollPercent * previewMaxScroll;
    }

    setTimeout(() => { scrollSource = null; }, 20);
  });
}

function onPreviewScroll() {
  if (!syncScroll.value || activeView.value !== 'split') return;
  if (scrollSource === 'textarea') return;

  scrollSource = 'preview';

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const ta = textarea.value;
    const preview = previewPane.value;
    if (!ta || !preview) return;

    const previewMaxScroll = preview.scrollHeight - preview.clientHeight;
    if (previewMaxScroll <= 0) return;

    const scrollPercent = preview.scrollTop / previewMaxScroll;
    const taMaxScroll = ta.scrollHeight - ta.clientHeight;

    if (taMaxScroll > 0) {
      ta.scrollTop = scrollPercent * taMaxScroll;
    }

    setTimeout(() => { scrollSource = null; }, 20);
  });
}

function toggleSyncAndAlign() {
  syncScroll.value = !syncScroll.value;

  if (syncScroll.value) {
    requestAnimationFrame(() => {
      const ta = textarea.value;
      const preview = previewPane.value;
      if (!ta || !preview) return;

      const taMaxScroll = ta.scrollHeight - ta.clientHeight;
      if (taMaxScroll > 0) {
        const scrollPercent = ta.scrollTop / taMaxScroll;
        const previewMaxScroll = preview.scrollHeight - preview.clientHeight;
        if (previewMaxScroll > 0) {
          preview.scrollTop = scrollPercent * previewMaxScroll;
        }
      }
    });
  }
}

// ============ Input Handling ============
function onInput(e) {
  emit('update:modelValue', localContent.value);

  // Clear suggestion on input
  suggestion.value = '';

  // Check for slash command
  checkSlashCommand();

  // Check for markdown prefix formatting
  checkMarkdownPrefix();

  // Trigger AI suggestion based on settings
  if (aiSettings.value.enabled) {
    triggerSuggestion();
  }
}

function onBlur() {
  // Delay closing to allow click on menu
  setTimeout(() => {
    if (showSlashMenu.value) {
      closeSlashMenu();
    }
  }, 150);
}

// ============ Keyboard Handling ============
function onKeydown(e) {
  // Handle slash menu navigation
  if (showSlashMenu.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      slashMenuRef.value?.handleKeydown(e);
      return;
    }
    // Continue typing to filter
    if (e.key === 'Backspace') {
      const ta = textarea.value;
      if (ta.selectionStart <= slashStartPos.value) {
        closeSlashMenu();
      }
    }
  }

  // Handle AI suggestion
  if (suggestion.value && aiSettings.value.enabled) {
    if (e.key === 'Tab') {
      e.preventDefault();
      acceptSuggestion();
      return;
    }
    if (e.key === 'ArrowRight' && !e.shiftKey) {
      // Accept word by word
      const cursorAtEnd = textarea.value.selectionStart === localContent.value.length;
      if (cursorAtEnd) {
        e.preventDefault();
        acceptWordFromSuggestion();
        return;
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      suggestion.value = '';
      return;
    }
  }

  // Manual suggestion trigger (Ctrl+Space)
  if (e.key === ' ' && e.ctrlKey && aiSettings.value.enabled) {
    e.preventDefault();
    requestSuggestion();
    return;
  }

  // Tab for indentation (when no suggestion)
  if (e.key === 'Tab' && !suggestion.value) {
    e.preventDefault();
    insertText('  ');
    return;
  }

  // Handle wrapper shortcuts
  handleWrapperShortcut(e);
}

// ============ Markdown Prefix Detection ============
function checkMarkdownPrefix() {
  const ta = textarea.value;
  if (!ta) return;

  const pos = ta.selectionStart;
  const content = localContent.value;

  // Get current line
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
  const lineEnd = content.indexOf('\n', pos);
  const currentLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);

  // Check if we just typed a space after a markdown prefix
  const beforeCursor = content.substring(lineStart, pos);

  // Patterns to detect (with space)
  const prefixPatterns = [
    { pattern: /^#{1,3} $/, keep: true },       // Headings
    { pattern: /^[-*] $/, keep: true },          // Bullet
    { pattern: /^\d+\. $/, keep: true },         // Numbered
    { pattern: /^> $/, keep: true },             // Quote
    { pattern: /^- \[ \] $/, keep: true },       // Todo
  ];

  // This is handled visually in CSS - no transformation needed
  // The preview pane shows the formatted version
}

// ============ Wrapper Shortcuts ============
function handleWrapperShortcut(e) {
  const ta = textarea.value;
  if (!ta) return;

  const wrappers = {
    '*': { double: '**', single: '*' },
    '_': { double: '__', single: '_' },
    '`': { single: '`' },
    '~': { double: '~~' }
  };

  const wrapper = wrappers[e.key];
  if (!wrapper) return;

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const hasSelection = start !== end;

  // If there's a selection, wrap it
  if (hasSelection) {
    e.preventDefault();
    const selectedText = localContent.value.substring(start, end);
    const wrap = wrapper.double || wrapper.single;
    const newText = wrap + selectedText + wrap;

    localContent.value =
      localContent.value.substring(0, start) +
      newText +
      localContent.value.substring(end);

    emit('update:modelValue', localContent.value);

    nextTick(() => {
      ta.focus();
      const wrapLen = wrap.length;
      ta.setSelectionRange(start + wrapLen, end + wrapLen);
    });
  }
}

// ============ Slash Commands ============
function checkSlashCommand() {
  const ta = textarea.value;
  if (!ta) return;

  const pos = ta.selectionStart;
  const content = localContent.value;

  // Find the start of current line
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
  const textBeforeCursor = content.substring(lineStart, pos);

  // Check if we have a slash command in progress
  const slashMatch = textBeforeCursor.match(/\/([a-z0-9]*)$/i);

  if (slashMatch) {
    if (!showSlashMenu.value) {
      // Starting a new slash command
      slashStartPos.value = pos - slashMatch[0].length;
      showSlashMenu.value = true;
      updateSlashMenuPosition();
    }
    slashFilter.value = slashMatch[1] || '';
  } else if (showSlashMenu.value) {
    closeSlashMenu();
  }
}

function updateSlashMenuPosition() {
  const ta = textarea.value;
  if (!ta) return;

  // Get cursor position in textarea
  const rect = ta.getBoundingClientRect();

  // Create a temporary element to measure cursor position
  const mirror = document.createElement('div');
  const style = getComputedStyle(ta);

  mirror.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: ${style.fontFamily};
    font-size: ${style.fontSize};
    line-height: ${style.lineHeight};
    padding: ${style.padding};
    width: ${ta.clientWidth}px;
  `;

  const textBeforeCursor = localContent.value.substring(0, slashStartPos.value);
  mirror.textContent = textBeforeCursor;

  const marker = document.createElement('span');
  marker.textContent = '/';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  document.body.removeChild(mirror);

  // Calculate position relative to textarea
  const relativeTop = markerRect.top - mirrorRect.top;
  const relativeLeft = markerRect.left - mirrorRect.left;

  slashMenuPosition.value = {
    top: rect.top + relativeTop + parseInt(style.lineHeight) + ta.scrollTop * -1 + 24,
    left: rect.left + relativeLeft
  };
}

function onSlashCommand(cmd) {
  const ta = textarea.value;
  if (!ta) return;

  // Remove the slash command text
  const beforeSlash = localContent.value.substring(0, slashStartPos.value);
  const afterCursor = localContent.value.substring(ta.selectionStart);

  localContent.value = beforeSlash + cmd.insert + afterCursor;
  emit('update:modelValue', localContent.value);

  closeSlashMenu();

  nextTick(() => {
    ta.focus();
    const newPos = slashStartPos.value + cmd.cursorOffset;
    ta.setSelectionRange(newPos, newPos);
  });
}

function closeSlashMenu() {
  showSlashMenu.value = false;
  slashFilter.value = '';
  slashStartPos.value = 0;
}

// ============ AI Suggestions ============
function triggerSuggestion() {
  if (!aiSettings.value.enabled) return;

  const mode = aiSettings.value.triggerMode;

  // Clear existing timer
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }
  suggestionService.cancelSuggestion();

  if (mode === 'manual') {
    // Don't auto-trigger in manual mode
    return;
  }

  const delay = mode === 'full' ? 500 : 1500; // Full auto: 500ms, Smart: 1500ms

  suggestionTimer = setTimeout(() => {
    requestSuggestion();
  }, delay);
}

async function requestSuggestion() {
  if (!aiSettings.value.enabled) return;

  const ta = textarea.value;
  if (!ta) return;

  const pos = ta.selectionStart;
  const content = localContent.value;

  // Don't suggest if slash menu is open
  if (showSlashMenu.value) return;

  // Don't suggest at start of document with no content
  if (!content.trim()) return;

  suggestionPending.value = true;

  try {
    const result = await suggestionService.getSuggestion(content, pos);
    if (result && ta.selectionStart === pos) {
      // Only show if cursor hasn't moved
      suggestion.value = result;
      updateGhostTextPosition();
    }
  } catch (err) {
    console.error('Suggestion error:', err);
  } finally {
    suggestionPending.value = false;
  }
}

function acceptSuggestion() {
  if (!suggestion.value) return;

  const ta = textarea.value;
  const pos = ta.selectionStart;

  localContent.value =
    localContent.value.substring(0, pos) +
    suggestion.value +
    localContent.value.substring(pos);

  emit('update:modelValue', localContent.value);

  const newPos = pos + suggestion.value.length;
  suggestion.value = '';

  nextTick(() => {
    ta.focus();
    ta.setSelectionRange(newPos, newPos);
  });
}

function acceptWordFromSuggestion() {
  if (!suggestion.value) return;

  const ta = textarea.value;
  const pos = ta.selectionStart;

  // Find first word boundary (space or end)
  const wordMatch = suggestion.value.match(/^\S+\s?/);
  if (!wordMatch) return;

  const word = wordMatch[0];
  const remaining = suggestion.value.substring(word.length);

  localContent.value =
    localContent.value.substring(0, pos) +
    word +
    localContent.value.substring(pos);

  emit('update:modelValue', localContent.value);

  const newPos = pos + word.length;
  suggestion.value = remaining;

  nextTick(() => {
    ta.focus();
    ta.setSelectionRange(newPos, newPos);
    if (remaining) {
      updateGhostTextPosition();
    }
  });
}

function updateGhostTextPosition() {
  const ta = textarea.value;
  if (!ta || !suggestion.value) return;

  // Use a hidden element to measure cursor position
  const style = getComputedStyle(ta);
  const lineHeight = parseInt(style.lineHeight);
  const paddingTop = parseInt(style.paddingTop);
  const paddingLeft = parseInt(style.paddingLeft);

  // Count lines before cursor
  const textBeforeCursor = localContent.value.substring(0, ta.selectionStart);
  const lines = textBeforeCursor.split('\n');
  const currentLineIndex = lines.length - 1;
  const currentLineText = lines[currentLineIndex];

  // Approximate character width
  const charWidth = 9.6; // Average for 16px font

  ghostTextStyle.value = {
    top: `${paddingTop + (currentLineIndex * lineHeight) - ta.scrollTop}px`,
    left: `${paddingLeft + (currentLineText.length * charWidth)}px`
  };
}

// ============ Text Manipulation ============
function insertMarkdown(before, after) {
  const ta = textarea.value;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = localContent.value;
  const selectedText = text.substring(start, end);

  const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
  localContent.value = newText;
  emit('update:modelValue', newText);

  setTimeout(() => {
    ta.focus();
    ta.setSelectionRange(start + before.length, start + before.length + selectedText.length);
  }, 0);
}

function insertText(text) {
  const ta = textarea.value;
  if (!ta) return;

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const currentContent = localContent.value || '';

  const newText = currentContent.substring(0, start) + text + currentContent.substring(end);
  localContent.value = newText;
  emit('update:modelValue', newText);

  setTimeout(() => {
    ta.focus();
    ta.setSelectionRange(start + text.length, start + text.length);
  }, 0);
}

defineExpose({ insertMarkdown, insertText });

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue;
  }
});

// Clear suggestion when content changes externally
watch(() => props.modelValue, () => {
  suggestion.value = '';
});
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  background: var(--color-bg-elevated);
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
  margin: 0 var(--space-2);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.toolbar-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.toolbar-btn:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-border);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.toolbar-btn:hover::before {
  opacity: 1;
}

.toolbar-btn:active {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(0);
  box-shadow: none;
}

/* Toolbar Layout */
.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

/* View Toggle */
.view-toggle {
  display: flex;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  padding: 3px;
  gap: 2px;
  border: 1px solid var(--color-border-light);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.toggle-btn:hover {
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.5);
}

.toggle-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.toggle-btn.active svg {
  color: var(--color-primary);
}

/* Split Divider */
.split-divider {
  position: relative;
  width: 1px;
  flex-shrink: 0;
  background: var(--color-border-light);
}

/* Sync Scroll Toggle */
.sync-scroll-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: var(--color-text-tertiary);
}

.sync-scroll-btn:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translate(-50%, -50%) scale(1.1);
}

.sync-scroll-btn.active {
  background: rgba(16, 185, 129, 0.12);
  border-color: #10b981;
  color: #10b981;
}

.sync-scroll-btn.active:hover {
  background: rgba(16, 185, 129, 0.2);
}

/* Editor Container */
.editor-container {
  position: relative;
  display: flex;
  flex: 1;
  overflow: hidden;
  border: none;
  box-shadow: none;
}

/* Editor Wrapper for Ghost Text */
.editor-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-textarea {
  flex: 1;
  padding: var(--space-6);
  border: none !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: none !important;
  resize: none;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.8;
  outline: none !important;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  caret-color: var(--color-primary);
}

.editor-textarea:focus {
  background: var(--color-bg-elevated);
}

.editor-textarea::placeholder {
  color: var(--color-text-tertiary);
}

.editor-textarea::selection {
  background: rgba(99, 102, 241, 0.2);
}

/* Ghost Text Overlay */
.ghost-text-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 1;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.8;
}

.ghost-text {
  color: var(--color-text-tertiary);
  font-style: italic;
  opacity: 0.6;
}

/* Preview Pane */
.editor-preview {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

/* View Mode Styles */
.view-write .editor-wrapper {
  max-width: 100%;
  margin: 0;
}

.view-write .editor-textarea {
  max-width: 100%;
  margin: 0;
  border: none;
  padding: var(--space-4) var(--space-6);
}

.view-preview .editor-preview {
  max-width: 100%;
  margin: 0;
  padding: var(--space-4) var(--space-6);
}

.view-split .editor-wrapper {
  max-width: none;
  margin: 0;
}

.view-split .editor-textarea {
  border-right: none;
  max-width: none;
  margin: 0;
}

.view-split .editor-preview {
  max-width: none;
  margin: 0;
}

.editor-preview :deep(h1),
.editor-preview :deep(h2),
.editor-preview :deep(h3),
.editor-preview :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.editor-preview :deep(h1) {
  font-size: 1.875em;
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 0.3em;
}

.editor-preview :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 0.3em;
}

.editor-preview :deep(h3) {
  font-size: 1.25em;
}

.editor-preview :deep(p) {
  margin: 1em 0;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.editor-preview :deep(ul),
.editor-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 1em 0;
}

.editor-preview :deep(li) {
  margin: 0.25em 0;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.editor-preview :deep(code) {
  background: var(--color-primary-subtle);
  color: var(--color-primary-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.875em;
}

.editor-preview :deep(pre) {
  background: var(--color-bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid var(--color-border-light);
}

.editor-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--color-text-primary);
}

.editor-preview :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-4);
  margin: 1em 0;
  color: var(--color-text-tertiary);
  font-style: italic;
  background: var(--color-bg-secondary);
  padding: var(--space-3) var(--space-4);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.editor-preview :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.editor-preview :deep(a:hover) {
  text-decoration: underline;
}

.editor-preview :deep(hr) {
  border: none;
  height: 1px;
  background: var(--color-border);
  margin: 2em 0;
}

.editor-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.editor-preview :deep(th),
.editor-preview :deep(td) {
  border: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-3);
  text-align: left;
}

.editor-preview :deep(th) {
  background: var(--color-bg-secondary);
  font-weight: 600;
}

.editor-preview :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-md);
}

/* Mobile */
@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
  }

  .editor-wrapper {
    min-height: 200px;
  }

  .editor-textarea {
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
    min-height: 200px;
  }

  .editor-preview {
    min-height: 200px;
  }
}
</style>
