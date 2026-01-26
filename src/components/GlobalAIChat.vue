<template>
  <div class="global-ai-chat">
    <div class="chat-header">
      <div>
        <h3>AI Assistant</h3>
        <p class="chat-subtitle">Search your notes with AI-powered RAG</p>
      </div>
      <button @click="emit('close')" class="close-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="quick-actions">
      <button @click="summarizeAll" class="action-btn" :disabled="isLoading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6M16 13H8M16 17H8"/>
        </svg>
        Summarize
      </button>
      <button @click="askQuestion" class="action-btn" :disabled="isLoading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Ask
      </button>
      <button @click="generateIdeas" class="action-btn" :disabled="isLoading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Ideas
      </button>
      <button @click="findConnections" class="action-btn" :disabled="isLoading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="5" cy="6" r="3"/>
          <circle cx="19" cy="6" r="3"/>
          <circle cx="12" cy="18" r="3"/>
          <line x1="5" y1="9" x2="12" y2="15"/>
          <line x1="19" y1="9" x2="12" y2="15"/>
        </svg>
        Connect
      </button>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <!-- Welcome state -->
      <div v-if="messages.length === 0 && !isLoading" class="welcome-state">
        <div class="welcome-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h3>Semantic Search Ready</h3>
        <p>Ask questions about your notes using natural language. AI will find relevant content and provide answers with citations.</p>
      </div>

      <!-- Messages -->
      <template v-else>
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message', message.role]"
        >
          <div v-if="message.role === 'assistant'" class="message-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="message-bubble">
            <div class="message-content">{{ message.content }}</div>
            <!-- Message Actions -->
            <div v-if="message.role === 'assistant'" class="message-actions">
              <button @click="saveAsNote(message, index)" class="save-note-btn" title="Save as new note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Save as Note
              </button>
            </div>
            <!-- Sources -->
            <div v-if="message.sources && message.sources.length > 0" class="message-sources">
              <div class="sources-header">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                </svg>
                <span>Sources</span>
              </div>
              <div class="sources-list">
                <button
                  v-for="source in message.sources"
                  :key="source.noteId"
                  @click="openNote(source.noteId)"
                  class="source-chip"
                  :title="`Relevance: ${source.relevance || Math.round((source.score || 0) * 100)}%`"
                >
                  <span class="source-index">[{{ source.index }}]</span>
                  <span class="source-title">{{ source.noteTitle || source.title }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="thinking-indicator">
        <div class="thinking-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="thinking-content">
          <div class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="thinking-text">Searching your notes...</span>
        </div>
      </div>
    </div>

    <div class="chat-prompt-container">
      <div class="prompt-suggestions" v-if="messages.length === 0">
        <span>Try:</span>
        <button @click="setPrompt('What are the main themes in my notes?')">Main themes</button>
        <button @click="setPrompt('Summarize my recent learnings')">Recent learnings</button>
        <button @click="setPrompt('What should I focus on next?')">Next focus</button>
      </div>
      <form @submit.prevent="sendMessage" class="chat-input">
        <input
          v-model="userInput"
          type="text"
          placeholder="Ask about your notes..."
          :disabled="isLoading"
          ref="inputRef"
        >
        <button type="submit" :disabled="isLoading || !userInput.trim()" class="send-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { ragService } from '../services/ragService.js';

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  currentNotebookId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close', 'openNote', 'createNote']);

const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);
const inputRef = ref(null);

onMounted(() => {
  inputRef.value?.focus();
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isLoading.value) return;

  messages.value.push({ role: 'user', content: message });
  userInput.value = '';
  isLoading.value = true;

  await scrollToBottom();

  try {
    const result = await ragService.askQuestion(message, {
      topK: 5,
      notebookId: props.currentNotebookId
    });

    messages.value.push({
      role: 'assistant',
      content: result.content,
      sources: result.sources
    });
  } catch (error) {
    console.error('RAG chat error:', error);
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error while searching your notes. Please try again.'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
    inputRef.value?.focus();
  }
}

async function summarizeAll() {
  if (props.notes.length === 0) {
    messages.value.push({
      role: 'assistant',
      content: 'You don\'t have any notes yet. Create some notes first!'
    });
    return;
  }

  messages.value.push({ role: 'user', content: 'Summarize my notes and highlight the main themes.' });
  isLoading.value = true;
  await scrollToBottom();

  try {
    const result = await ragService.summarizeNotes(null, props.currentNotebookId);
    messages.value.push({
      role: 'assistant',
      content: result.content,
      sources: result.sources
    });
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Failed to summarize notes. Please try again.'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
}

async function askQuestion() {
  const question = prompt('What do you want to know about your notes?');
  if (question) {
    userInput.value = question;
    await sendMessage();
  }
}

async function generateIdeas() {
  messages.value.push({ role: 'user', content: 'Based on my notes, suggest creative ideas and next steps.' });
  isLoading.value = true;
  await scrollToBottom();

  try {
    const result = await ragService.generateIdeas(null, props.currentNotebookId);
    messages.value.push({
      role: 'assistant',
      content: result.content,
      sources: result.sources
    });
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Failed to generate ideas. Please try again.'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
}

async function findConnections() {
  if (props.notes.length < 2) {
    messages.value.push({
      role: 'assistant',
      content: 'You need at least 2 notes to find connections between them.'
    });
    return;
  }

  messages.value.push({ role: 'user', content: 'What connections and themes can you find between my notes?' });
  isLoading.value = true;
  await scrollToBottom();

  try {
    const result = await ragService.findConnections(props.currentNotebookId);
    messages.value.push({
      role: 'assistant',
      content: result.content,
      sources: result.sources
    });
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Failed to find connections. Please try again.'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
}

function setPrompt(prompt) {
  userInput.value = prompt;
  inputRef.value?.focus();
}

function openNote(noteId) {
  emit('openNote', noteId);
}

function saveAsNote(message, index) {
  // Find the user question that preceded this response
  const userMessage = messages.value[index - 1];
  const title = userMessage ? `AI: ${userMessage.content.slice(0, 50)}${userMessage.content.length > 50 ? '...' : ''}` : 'AI Generated Note';

  emit('createNote', {
    title,
    content: message.content,
    sources: message.sources || []
  });
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}
</script>

<style scoped>
.global-ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-elevated);
}

.chat-header {
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: start;
  position: relative;
  overflow: hidden;
}

.chat-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.chat-header h3 {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
}

.chat-subtitle {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
  position: relative;
  z-index: 1;
}

.close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background:
    radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
    var(--color-bg-primary);
}

.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: var(--space-8);
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: var(--radius-xl);
  color: var(--color-primary);
  margin-bottom: var(--space-4);
}

.welcome-state h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.welcome-state p {
  margin: var(--space-2) 0 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
  max-width: 280px;
}

.message {
  display: flex;
  gap: var(--space-3);
  max-width: 90%;
  animation: messageSlide 0.3s ease;
}

@keyframes messageSlide {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.message-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-radius: var(--radius-full);
  color: white;
  flex-shrink: 0;
}

.message-bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  line-height: 1.6;
  font-size: 14px;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  color: white;
  border-bottom-right-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.message.assistant .message-bubble {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-bottom-left-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.message-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.save-note-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-note-btn:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
  border-color: #22c55e;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.save-note-btn svg {
  flex-shrink: 0;
}

.message-sources {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.sources-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.sources-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.source-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-chip:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.source-index {
  font-weight: 700;
  opacity: 0.7;
}

.source-title {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thinking-indicator {
  display: flex;
  gap: var(--space-3);
  align-self: flex-start;
  animation: fadeIn 0.3s ease;
}

.thinking-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-radius: var(--radius-full);
  color: white;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.thinking-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-sm);
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.thinking-text {
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-style: italic;
}

.chat-prompt-container {
  border-top: 1px solid var(--color-border-light);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
}

.prompt-suggestions {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  overflow-x: auto;
  padding: var(--space-1) 0;
}

.prompt-suggestions span {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 0;
}

.prompt-suggestions button {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.prompt-suggestions button:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.chat-input {
  display: flex;
  gap: var(--space-2);
}

.chat-input input {
  flex: 1;
  padding: 12px 18px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  outline: none;
  font-size: 14px;
  font-weight: 500;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  transition: all 0.2s ease;
}

.chat-input input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.chat-input input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
