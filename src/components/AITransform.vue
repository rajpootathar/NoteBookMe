<template>
  <div v-if="isOpen" class="transform-overlay" @click="closeOnBackdrop">
    <div class="transform-modal" @click.stop>
      <div class="transform-header">
        <h3>✨ AI Transform</h3>
        <button @click="close" class="close-btn">×</button>
      </div>

      <div class="transform-content">
        <div class="note-preview">
          <div class="preview-header">Original Note:</div>
          <div class="preview-title">{{ note.title || 'Untitled' }}</div>
          <div class="preview-text">{{ getPreview(note.content) }}</div>
        </div>

        <div class="transform-options">
          <div class="options-header">Transform into:</div>
          <div class="options-grid">
            <button
              v-for="option in transformOptions"
              :key="option.id"
              :class="['option-card', { active: selectedOption === option.id }]"
              @click="selectedOption = option.id"
            >
              <span class="option-icon">{{ option.icon }}</span>
              <span class="option-label">{{ option.label }}</span>
              <span class="option-desc">{{ option.desc }}</span>
            </button>
          </div>
        </div>

        <div v-if="transformedContent" class="transform-result">
          <div class="result-header">
            <span>Transformed Content:</span>
            <button @click="copyToClipboard" class="copy-btn">
              {{ copied ? '✓ Copied!' : '📋 Copy' }}
            </button>
          </div>
          <div class="result-content">{{ transformedContent }}</div>
        </div>

        <div class="transform-actions">
          <button @click="close" class="cancel-btn">Cancel</button>
          <button @click="transform" class="transform-btn" :disabled="!selectedOption || isTransforming">
            {{ isTransforming ? 'Transforming...' : '✨ Transform' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { aiService } from '../services/ai.js';

const props = defineProps({
  note: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'transformed']);

const isOpen = ref(false);
const selectedOption = ref(null);
const transformedContent = ref('');
const isTransforming = ref(false);
const copied = ref(false);

const transformOptions = [
  { id: 'blog', icon: '📝', label: 'Blog Post', desc: 'Turn into a blog article' },
  { id: 'email', icon: '📧', label: 'Email', desc: 'Write as an email' },
  { id: 'summary', icon: '📋', label: 'Summary', desc: 'Create a summary' },
  { id: 'tweet', icon: '🐦', label: 'Thread', desc: 'Twitter thread' },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn Post', desc: 'Professional post' },
  { id: 'bullet', icon: '•', label: 'Bullet Points', desc: 'Key takeaways' },
  { id: 'action', icon: '✅', label: 'Action Items', desc: 'Extract tasks' },
  { id: 'polish', icon: '✨', label: 'Polished', desc: 'Improve writing' }
];

const prompts = {
  blog: `Transform this note into a well-structured blog post with an engaging introduction, clear body paragraphs, and a conclusion. Add a compelling title.`,
  email: `Transform this note into a professional email with a clear subject line, greeting, body, and call to action.`,
  summary: `Create a concise summary of this note. Highlight the key points and main takeaways.`,
  tweet: `Transform this note into a Twitter thread. Each tweet should be under 280 characters and build on the previous one. Use thread emojis (1/8, 2/8, etc.).`,
  linkedin: `Transform this note into an engaging LinkedIn post. Make it professional but conversational, with relevant hashtags.`,
  bullet: `Extract the key points from this note and present them as clear, actionable bullet points.`,
  action: `Extract all action items, tasks, and next steps from this note. Present them as a checklist.`,
  polish: `Improve the writing in this note. Fix grammar, enhance clarity, maintain the author's voice, and make it more engaging.`
};

function open() {
  isOpen.value = true;
  selectedOption.value = null;
  transformedContent.value = '';
}

function close() {
  isOpen.value = false;
  selectedOption.value = null;
  transformedContent.value = '';
  emit('close');
}

function closeOnBackdrop(e) {
  if (e.target.classList.contains('transform-overlay')) {
    close();
  }
}

function getPreview(content) {
  if (!content) return 'No content';
  return content.replace(/[#*`\[\]]/g, '').substring(0, 200) + '...';
}

async function transform() {
  if (!selectedOption.value || !props.note.content) return;

  isTransforming.value = true;

  try {
    const prompt = prompts[selectedOption.value];
    const result = await aiService.chat([
      {
        role: 'system',
        content: 'You are a content transformation expert. Transform content according to the user\'s instructions while maintaining the core meaning and intent.'
      },
      {
        role: 'user',
        content: `${prompt}\n\nHere's the note to transform:\n\nTitle: ${props.note.title}\n\n${props.note.content}`
      }
    ]);

    transformedContent.value = result;
    emit('transformed', { type: selectedOption.value, content: result });
  } catch (error) {
    transformedContent.value = 'Failed to transform. Please try again.';
  } finally {
    isTransforming.value = false;
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(transformedContent.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

// Handle keyboard
function handleKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) {
    close();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown);
}

defineExpose({ open });
</script>

<style scoped>
.transform-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(28, 25, 23, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: overlayFade 0.2s ease;
}

@keyframes overlayFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.transform-modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 90%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
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

.transform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.transform-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.close-btn {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--color-danger);
  transform: rotate(90deg);
}

.transform-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.note-preview {
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.preview-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.preview-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.options-header {
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--color-text-primary);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-3);
}

.option-card {
  padding: var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--color-bg-elevated);
}

.option-card:hover {
  border-color: var(--color-primary-light);
  background: var(--color-primary-subtle);
  transform: translateY(-2px);
}

.option-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.option-icon {
  font-size: 28px;
  display: block;
  margin-bottom: var(--space-2);
}

.option-label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  font-size: 14px;
}

.option-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.transform-result {
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border-light);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.result-header span {
  font-weight: 600;
  color: var(--color-text-primary);
}

.copy-btn {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.result-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-primary);
  white-space: pre-wrap;
}

.transform-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.cancel-btn,
.transform-btn {
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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

.transform-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.transform-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.transform-btn:active:not(:disabled) {
  transform: translateY(0);
}

.transform-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .transform-modal {
    width: 95%;
    padding: 16px;
  }

  .options-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .transform-actions {
    flex-direction: column;
  }

  .transform-actions button {
    width: 100%;
  }
}
</style>
