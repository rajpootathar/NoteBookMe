<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-group">
          <button @click="handleToolbarBold" title="Bold (Ctrl+B)" class="toolbar-btn" :class="{ 'is-active': richEditActive('bold') }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </button>
          <button @click="handleToolbarItalic" title="Italic (Ctrl+I)" class="toolbar-btn" :class="{ 'is-active': richEditActive('italic') }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          <button @click="handleToolbarStrike" title="Strikethrough" class="toolbar-btn" :class="{ 'is-active': richEditActive('strike') }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 7.2 3.3s7.2 1.8 7.2 3.3c0 2.9-2.7 3.6-5.3 3.6-1.8 0-3.9-.3-6.2-.9"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-group">
          <button @click="handleToolbarHeading" title="Heading" class="toolbar-btn" :class="{ 'is-active': richEditActive('heading') }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12h8M4 18V6M12 18V6M17 10l3 2-3 2"/>
            </svg>
          </button>
          <button @click="handleToolbarBulletList" title="Bullet List" class="toolbar-btn" :class="{ 'is-active': richEditActive('bulletList') }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="4" cy="6" r="1" fill="currentColor"/>
              <circle cx="4" cy="12" r="1" fill="currentColor"/>
              <circle cx="4" cy="18" r="1" fill="currentColor"/>
            </svg>
          </button>
          <button @click="handleToolbarLink" title="Link" class="toolbar-btn" :class="{ 'is-active': richEditActive('link') }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button @click="handleToolbarCode" title="Inline Code" class="toolbar-btn" :class="{ 'is-active': richEditActive('code') }">
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
            :class="['toggle-btn', { active: activeView === 'richedit' }]"
            @click="switchView('richedit')"
            title="Rich Edit mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Rich Edit
          </button>
          <button
            :class="['toggle-btn', { active: activeView === 'markdown' }]"
            @click="switchView('markdown')"
            title="Markdown mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            Markdown
          </button>
        </div>
      </div>
    </div>

    <div class="editor-container" :class="[`view-${activeView}`]">
      <!-- Markdown mode: textarea + ghost text + slash commands -->
      <div v-show="activeView === 'markdown'" class="editor-wrapper">
        <textarea
          ref="textarea"
          v-model="localContent"
          @input="onInput"
          @keydown="onKeydown"
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

      <!-- Slash command menu (markdown mode only) -->
      <SlashCommandMenu
        v-if="activeView === 'markdown'"
        ref="slashMenuRef"
        :visible="showSlashMenu"
        :position="slashMenuPosition"
        :filter="slashFilter"
        @select="onSlashCommand"
        @close="closeSlashMenu"
      />

      <!-- Rich Edit mode: Tiptap WYSIWYG -->
      <RichTextEditor
        v-if="activeView === 'richedit'"
        ref="richEditorRef"
        :modelValue="localContent"
        @update:modelValue="onRichEditUpdate"
      />
    </div>

    <!-- Help Panel -->
    <HelpPanel />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import SlashCommandMenu from './SlashCommandMenu.vue';
import HelpPanel from './HelpPanel.vue';
import RichTextEditor from './RichTextEditor.vue';
import { suggestionService } from '../services/suggestionService.js';

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
const richEditorRef = ref(null);
const activeView = ref(localStorage.getItem('editor-view-mode') || 'richedit');

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

// ============ View Switching ============
function switchView(view) {
  activeView.value = view;
  localStorage.setItem('editor-view-mode', view);
}

watch(activeView, (newView) => {
  nextTick(() => {
    if (newView === 'markdown' && textarea.value) {
      textarea.value.focus();
    } else if (newView === 'richedit' && richEditorRef.value) {
      richEditorRef.value.focus();
    }
  });
});

// ============ Rich Edit Active States ============
function richEditActive(type) {
  if (activeView.value !== 'richedit') return false;
  const editor = richEditorRef.value?.getEditor();
  if (!editor) return false;

  switch (type) {
    case 'bold': return editor.isActive('bold');
    case 'italic': return editor.isActive('italic');
    case 'strike': return editor.isActive('strike');
    case 'code': return editor.isActive('code');
    case 'heading': return editor.isActive('heading');
    case 'bulletList': return editor.isActive('bulletList');
    case 'link': return editor.isActive('link');
    default: return false;
  }
}

// ============ Toolbar Handlers ============
function handleToolbarBold() {
  if (activeView.value === 'richedit') {
    richEditorRef.value?.getEditor()?.chain().focus().toggleBold().run();
  } else {
    insertMarkdownRaw('**', '**');
  }
}

function handleToolbarItalic() {
  if (activeView.value === 'richedit') {
    richEditorRef.value?.getEditor()?.chain().focus().toggleItalic().run();
  } else {
    insertMarkdownRaw('*', '*');
  }
}

function handleToolbarStrike() {
  if (activeView.value === 'richedit') {
    richEditorRef.value?.getEditor()?.chain().focus().toggleStrike().run();
  } else {
    insertMarkdownRaw('~~', '~~');
  }
}

function handleToolbarHeading() {
  if (activeView.value === 'richedit') {
    richEditorRef.value?.getEditor()?.chain().focus().toggleHeading({ level: 2 }).run();
  } else {
    insertMarkdownRaw('## ', '');
  }
}

function handleToolbarBulletList() {
  if (activeView.value === 'richedit') {
    richEditorRef.value?.getEditor()?.chain().focus().toggleBulletList().run();
  } else {
    insertMarkdownRaw('- ', '');
  }
}

function handleToolbarLink() {
  if (activeView.value === 'richedit') {
    const editor = richEditorRef.value?.getEditor();
    if (!editor) return;
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  } else {
    insertMarkdownRaw('[', '](url)');
  }
}

function handleToolbarCode() {
  if (activeView.value === 'richedit') {
    richEditorRef.value?.getEditor()?.chain().focus().toggleCode().run();
  } else {
    insertMarkdownRaw('`', '`');
  }
}

// ============ Rich Edit Update Handler ============
function onRichEditUpdate(md) {
  localContent.value = md;
  emit('update:modelValue', md);
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
    insertTextRaw('  ');
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
    return;
  }

  const delay = mode === 'full' ? 3000 : 6000;

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

  if (showSlashMenu.value) return;
  if (!content.trim()) return;

  suggestionPending.value = true;

  try {
    const result = await suggestionService.getSuggestion(content, pos);
    if (result && ta.selectionStart === pos) {
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

  const style = getComputedStyle(ta);
  const paddingLeft = parseInt(style.paddingLeft) || 0;
  const paddingTop = parseInt(style.paddingTop) || 0;
  const lineHeight = parseFloat(style.lineHeight) || 28.8;

  const textBeforeCursor = localContent.value.substring(0, ta.selectionStart);
  const lines = textBeforeCursor.split('\n');
  const currentLineIndex = lines.length - 1;
  const currentLineText = lines[currentLineIndex];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

  const textWidth = ctx.measureText(currentLineText).width;

  const top = paddingTop + (currentLineIndex * lineHeight) - ta.scrollTop;
  const left = paddingLeft + textWidth;

  ghostTextStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  };
}

// ============ Text Manipulation (internal for markdown mode) ============
function insertMarkdownRaw(before, after) {
  const ta = textarea.value;
  if (!ta) return;
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

function insertTextRaw(text) {
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

// ============ Exposed API (routes to correct editor) ============
function insertMarkdown(before, after) {
  if (activeView.value === 'richedit' && richEditorRef.value) {
    richEditorRef.value.insertMarkdown(before, after);
  } else {
    insertMarkdownRaw(before, after);
  }
}

function insertText(text) {
  if (activeView.value === 'richedit' && richEditorRef.value) {
    richEditorRef.value.insertText(text);
  } else {
    insertTextRaw(text);
  }
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

.toolbar-btn.is-active {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
  color: var(--color-primary);
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
  padding: var(--space-4) var(--space-6);
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
  font-weight: 400;
  line-height: 1.8;
  white-space: pre;
}

.ghost-text {
  color: #9ca3af;
  font-style: italic;
  opacity: 0.7;
  background: transparent;
}

/* View Mode Styles */
.view-markdown .editor-wrapper {
  max-width: 100%;
  margin: 0;
}

.view-markdown .editor-textarea {
  max-width: 100%;
  margin: 0;
  border: none;
  padding: var(--space-4) var(--space-6);
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
}
</style>
