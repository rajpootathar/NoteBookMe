<template>
  <div class="studio-panel">
    <!-- Header -->
    <div class="studio-header">
      <h2>Studio</h2>
      <p class="studio-subtitle">Generate content from your sources</p>
    </div>

    <!-- Source Selection -->
    <div class="source-section">
      <div class="section-header">
        <h3>Sources</h3>
        <span class="source-count">{{ selectedSources.length }} selected</span>
      </div>
      <div class="source-actions">
        <button @click="selectAll" class="text-btn">Select all</button>
        <button @click="selectNone" class="text-btn">Clear</button>
      </div>
      <div class="source-list">
        <label
          v-for="source in sources"
          :key="source.id"
          class="source-item"
          :class="{ selected: selectedSources.includes(source.id) }"
        >
          <input
            type="checkbox"
            :value="source.id"
            v-model="selectedSources"
            class="source-checkbox"
          >
          <div class="source-info">
            <span class="source-title">{{ source.title || 'Untitled' }}</span>
            <span class="source-preview">{{ getPreview(source.content) }}</span>
          </div>
        </label>
        <div v-if="sources.length === 0" class="no-sources">
          <p>No notes yet</p>
          <span>Create notes to use as sources</span>
        </div>
      </div>
    </div>

    <!-- Output Types Grid -->
    <div class="output-section">
      <h3>Generate</h3>
      <div class="output-grid">
        <button
          @click="generate('faq')"
          class="output-card"
          :disabled="isGenerating || selectedSources.length === 0"
        >
          <div class="output-icon faq">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <span class="output-label">FAQ</span>
        </button>

        <button
          @click="generate('study-guide')"
          class="output-card"
          :disabled="isGenerating || selectedSources.length === 0"
        >
          <div class="output-icon study">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <span class="output-label">Study Guide</span>
        </button>

        <button
          @click="generate('summary')"
          class="output-card"
          :disabled="isGenerating || selectedSources.length === 0"
        >
          <div class="output-icon summary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span class="output-label">Summary</span>
        </button>

        <button
          @click="generate('briefing')"
          class="output-card"
          :disabled="isGenerating || selectedSources.length === 0"
        >
          <div class="output-icon briefing">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span class="output-label">Briefing</span>
        </button>

        <button
          @click="generate('timeline')"
          class="output-card"
          :disabled="isGenerating || selectedSources.length === 0"
        >
          <div class="output-icon timeline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <circle cx="12" cy="6" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="18" r="2"/>
            </svg>
          </div>
          <span class="output-label">Timeline</span>
        </button>

        <button
          @click="generate('outline')"
          class="output-card"
          :disabled="isGenerating || selectedSources.length === 0"
        >
          <div class="output-icon outline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <span class="output-label">Outline</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isGenerating" class="generating-overlay">
      <div class="generating-content">
        <div class="generating-spinner"></div>
        <span>Generating {{ currentOutputTitle }}...</span>
      </div>
    </div>

    <!-- Generated Output Modal -->
    <div v-if="generatedOutput" class="output-modal">
      <div class="modal-header">
        <h3>{{ currentOutputTitle }}</h3>
        <div class="modal-actions">
          <button @click="copyOutput" class="icon-btn" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button @click="saveAsNote" class="icon-btn" title="Save as note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </button>
          <button @click="generatedOutput = null" class="icon-btn close" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="modal-body">
        <div class="markdown-content" v-html="renderedOutput"></div>
      </div>
      <div class="modal-footer">
        <span class="sources-label">Based on {{ outputSourceNames.length }} sources</span>
        <div class="source-tags">
          <span v-for="name in outputSourceNames.slice(0, 5)" :key="name" class="source-tag">{{ name }}</span>
          <span v-if="outputSourceNames.length > 5" class="source-tag more">+{{ outputSourceNames.length - 5 }} more</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';
import { aiService } from '../services/ai.js';

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['createNote']);

const sources = computed(() => props.notes);
const selectedSources = ref([]);
const isGenerating = ref(false);
const generatedOutput = ref(null);
const currentOutputTitle = ref('');
const outputSourceNames = ref([]);

// Auto-select first 10 sources when notes change
watch(() => props.notes, (notes) => {
  if (notes.length > 0 && selectedSources.value.length === 0) {
    selectedSources.value = notes.slice(0, 10).map(n => n.id);
  }
}, { immediate: true });

const renderedOutput = computed(() => {
  if (!generatedOutput.value) return '';
  return marked(generatedOutput.value);
});

function selectAll() {
  selectedSources.value = sources.value.map(s => s.id);
}

function selectNone() {
  selectedSources.value = [];
}

function getPreview(content) {
  if (!content) return 'No content';
  const text = content.replace(/[#*_`\[\]]/g, '').slice(0, 60);
  return text.length < content.length ? text + '...' : text;
}

const outputTemplates = {
  'faq': {
    title: 'FAQ',
    prompt: `Based on the following sources, generate a comprehensive FAQ document.

Create 8-12 questions and answers that cover the main topics. Format as:

## Q: [Question]
**A:** [Detailed answer]

Make questions progressively more specific.

Sources:
{sources}`
  },
  'study-guide': {
    title: 'Study Guide',
    prompt: `Create a comprehensive study guide from these sources.

Include:
## Key Concepts
5-10 main concepts with explanations

## Important Terms
Key vocabulary with definitions

## Main Ideas
Core ideas as bullet points

## Review Questions
5-7 test questions

## Quick Reference
Condensed summary

Sources:
{sources}`
  },
  'summary': {
    title: 'Executive Summary',
    prompt: `Write an executive summary from these sources.

## Overview
2-3 sentence high-level summary

## Key Points
Bullet points of most important information

## Details
Expand on key points

## Conclusions
Main takeaways

Sources:
{sources}`
  },
  'briefing': {
    title: 'Briefing Document',
    prompt: `Create a professional briefing document.

## Background
Context and background

## Current Situation
Present state

## Key Findings
Numbered findings with explanations

## Recommendations
Actionable suggestions

## Next Steps
Proposed actions

Sources:
{sources}`
  },
  'timeline': {
    title: 'Timeline',
    prompt: `Create a timeline of events/developments.

## Timeline

### [Period/Phase 1]
- Key event or development
- Details

### [Period/Phase 2]
- Key event or development
- Details

(Continue for all significant points)

## Summary
Brief overview of progression

Use relative ordering if exact dates unavailable.

Sources:
{sources}`
  },
  'outline': {
    title: 'Content Outline',
    prompt: `Create a detailed hierarchical outline.

# [Main Topic]

## I. [First Major Section]
   A. Subtopic
      1. Detail
      2. Detail
   B. Subtopic

## II. [Second Major Section]
   A. Subtopic
   B. Subtopic

## Key Themes
- Theme 1
- Theme 2

Sources:
{sources}`
  }
};

async function generate(type) {
  if (selectedSources.value.length === 0) return;

  const template = outputTemplates[type];
  if (!template) return;

  isGenerating.value = true;
  currentOutputTitle.value = template.title;
  generatedOutput.value = null;

  try {
    const selectedNotes = sources.value.filter(n => selectedSources.value.includes(n.id));
    outputSourceNames.value = selectedNotes.map(n => n.title || 'Untitled');

    const sourceContent = selectedNotes.map((note, i) => {
      return `[Source ${i + 1}: ${note.title || 'Untitled'}]\n${note.content}`;
    }).join('\n\n---\n\n');

    const prompt = template.prompt.replace('{sources}', sourceContent);

    const response = await aiService.chat([
      {
        role: 'system',
        content: 'You are a helpful assistant that creates well-structured documents. Use markdown formatting. Be thorough but concise.'
      },
      { role: 'user', content: prompt }
    ], { maxTokens: 3000 });

    generatedOutput.value = response;
  } catch (error) {
    console.error('Generation error:', error);
    generatedOutput.value = '**Error:** Failed to generate content. Please try again.';
  } finally {
    isGenerating.value = false;
  }
}

function copyOutput() {
  if (generatedOutput.value) {
    navigator.clipboard.writeText(generatedOutput.value);
  }
}

function saveAsNote() {
  if (generatedOutput.value) {
    emit('createNote', {
      title: currentOutputTitle.value,
      content: generatedOutput.value
    });
    generatedOutput.value = null;
  }
}
</script>

<style scoped>
.studio-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border-light);
  position: relative;
}

.studio-header {
  padding: var(--space-5);
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  color: white;
}

.studio-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.studio-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.9;
}

.source-section {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  max-height: 220px;
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.section-header h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

.source-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.source-actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
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
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.source-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.source-item:hover {
  border-color: var(--color-border);
}

.source-item.selected {
  background: rgba(245, 158, 11, 0.08);
  border-color: #f59e0b;
}

.source-checkbox {
  margin-top: 2px;
  accent-color: #f59e0b;
}

.source-info {
  flex: 1;
  min-width: 0;
}

.source-title {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-preview {
  display: block;
  font-size: 10px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-sources {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-text-tertiary);
}

.no-sources p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.no-sources span {
  font-size: 11px;
}

.output-section {
  padding: var(--space-4);
}

.output-section h3 {
  margin: 0 0 var(--space-3);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.output-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.output-card:hover:not(:disabled) {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  transform: translateY(-2px);
}

.output-card:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.output-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.output-icon.faq { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.output-icon.study { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.output-icon.summary { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.output-icon.briefing { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.output-icon.timeline { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
.output-icon.outline { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

.output-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.generating-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.generating-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.generating-content span {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.output-modal {
  position: absolute;
  inset: 0;
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: var(--space-2);
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
}

.icon-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.icon-btn.close:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.markdown-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-primary);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: var(--space-5);
  margin-bottom: var(--space-3);
  font-weight: 600;
  color: var(--color-text-primary);
}

.markdown-content :deep(h1) { font-size: 20px; }
.markdown-content :deep(h2) { font-size: 16px; }
.markdown-content :deep(h3) { font-size: 14px; }

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: var(--space-5);
  margin: var(--space-3) 0;
}

.markdown-content :deep(li) {
  margin: var(--space-2) 0;
}

.markdown-content :deep(p) {
  margin: var(--space-3) 0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-footer {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-light);
}

.sources-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.source-tag {
  padding: 2px 8px;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 500;
}

.source-tag.more {
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .output-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
