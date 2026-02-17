<template>
  <div class="rich-text-editor" @click="focusEditor">
    <div ref="editorElement" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { Editor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Markdown } from 'tiptap-markdown';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const editorElement = ref(null);
const editor = shallowRef(null);
let isUpdatingFromProp = false;
let isUpdatingFromEditor = false;

onMounted(() => {
  editor.value = new Editor({
    element: editorElement.value,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing... Type / for commands',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: props.modelValue,
    onUpdate: ({ editor: ed }) => {
      if (isUpdatingFromProp) return;
      isUpdatingFromEditor = true;
      const md = ed.storage.markdown.getMarkdown();
      emit('update:modelValue', md);
      isUpdatingFromEditor = false;
    },
  });
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

watch(() => props.modelValue, (newValue) => {
  if (!editor.value) return;
  if (isUpdatingFromEditor) return;

  const currentMd = editor.value.storage.markdown.getMarkdown();
  if (newValue !== currentMd) {
    isUpdatingFromProp = true;
    editor.value.commands.setContent(newValue);
    isUpdatingFromProp = false;
  }
});

function focusEditor() {
  if (editor.value && !editor.value.isFocused) {
    editor.value.commands.focus('end');
  }
}

function insertMarkdown(before, after) {
  if (!editor.value) return;
  const chain = editor.value.chain().focus();

  if (before === '**' && after === '**') {
    chain.toggleBold().run();
  } else if (before === '*' && after === '*') {
    chain.toggleItalic().run();
  } else if (before === '~~' && after === '~~') {
    chain.toggleStrike().run();
  } else if (before === '`' && after === '`') {
    chain.toggleCode().run();
  } else if (before === '## ' && after === '') {
    chain.toggleHeading({ level: 2 }).run();
  } else if (before === '# ' && after === '') {
    chain.toggleHeading({ level: 1 }).run();
  } else if (before === '### ' && after === '') {
    chain.toggleHeading({ level: 3 }).run();
  } else if (before === '- ' && after === '') {
    chain.toggleBulletList().run();
  } else if (before === '> ' && after === '') {
    chain.toggleBlockquote().run();
  } else if (before === '[' && after === '](url)') {
    const { from, to } = editor.value.state.selection;
    const selectedText = editor.value.state.doc.textBetween(from, to, '');
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      chain.setLink({ href: url }).run();
    }
  } else {
    // Fallback: insert raw markdown text
    const { from, to } = editor.value.state.selection;
    const selectedText = editor.value.state.doc.textBetween(from, to, '');
    editor.value.chain().focus()
      .deleteSelection()
      .insertContent(before + selectedText + after)
      .run();
  }
}

function insertText(text) {
  if (!editor.value) return;
  editor.value.chain().focus().insertContent(text).run();
}

function focus() {
  if (editor.value) {
    editor.value.commands.focus();
  }
}

function getEditor() {
  return editor.value;
}

defineExpose({ insertMarkdown, insertText, focus, getEditor });
</script>

<style scoped>
.rich-text-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  cursor: text;
  background: var(--color-bg-elevated);
}

.rich-text-editor :deep(.tiptap) {
  flex: 1;
  padding: var(--space-4) var(--space-6);
  outline: none;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-primary);
  caret-color: var(--color-primary);
  min-height: 100%;
}

/* Placeholder */
.rich-text-editor :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-tertiary);
  pointer-events: none;
  height: 0;
}

/* Headings */
.rich-text-editor :deep(h1),
.rich-text-editor :deep(h2),
.rich-text-editor :deep(h3),
.rich-text-editor :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.rich-text-editor :deep(h1) {
  font-size: 1.875em;
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 0.3em;
}

.rich-text-editor :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 0.3em;
}

.rich-text-editor :deep(h3) {
  font-size: 1.25em;
}

/* Paragraphs */
.rich-text-editor :deep(p) {
  margin: 1em 0;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

/* Lists */
.rich-text-editor :deep(ul),
.rich-text-editor :deep(ol) {
  padding-left: 1.5em;
  margin: 1em 0;
}

.rich-text-editor :deep(li) {
  margin: 0.25em 0;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.rich-text-editor :deep(li p) {
  margin: 0;
}

/* Task lists */
.rich-text-editor :deep(ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

.rich-text-editor :deep(ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

.rich-text-editor :deep(ul[data-type="taskList"] li label) {
  display: flex;
  align-items: center;
  margin-top: 0.25em;
}

.rich-text-editor :deep(ul[data-type="taskList"] li label input[type="checkbox"]) {
  cursor: pointer;
  accent-color: var(--color-primary);
  width: 16px;
  height: 16px;
}

.rich-text-editor :deep(ul[data-type="taskList"] li > div) {
  flex: 1;
}

/* Inline code */
.rich-text-editor :deep(code) {
  background: var(--color-primary-subtle);
  color: var(--color-primary-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.875em;
}

/* Code blocks */
.rich-text-editor :deep(pre) {
  background: var(--color-bg-secondary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid var(--color-border-light);
}

.rich-text-editor :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--color-text-primary);
  font-size: 0.875em;
  line-height: 1.6;
}

/* Blockquote */
.rich-text-editor :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding: var(--space-3) var(--space-4);
  margin: 1em 0;
  color: var(--color-text-tertiary);
  font-style: italic;
  background: var(--color-bg-secondary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.rich-text-editor :deep(blockquote p) {
  margin: 0;
}

/* Links */
.rich-text-editor :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
}

.rich-text-editor :deep(a:hover) {
  text-decoration: underline;
}

/* Horizontal rule */
.rich-text-editor :deep(hr) {
  border: none;
  height: 1px;
  background: var(--color-border);
  margin: 2em 0;
}

/* Tables */
.rich-text-editor :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.rich-text-editor :deep(th),
.rich-text-editor :deep(td) {
  border: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-3);
  text-align: left;
  min-width: 80px;
}

.rich-text-editor :deep(th) {
  background: var(--color-bg-secondary);
  font-weight: 600;
}

.rich-text-editor :deep(.selectedCell) {
  background: rgba(99, 102, 241, 0.1);
}

.rich-text-editor :deep(.column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: var(--color-primary);
  pointer-events: none;
}

.rich-text-editor :deep(.tableWrapper) {
  overflow-x: auto;
  margin: 1em 0;
}

.rich-text-editor :deep(.resize-cursor) {
  cursor: col-resize;
}

/* Images */
.rich-text-editor :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-md);
}

/* Selection */
.rich-text-editor :deep(::selection) {
  background: rgba(99, 102, 241, 0.2);
}
</style>
