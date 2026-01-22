<template>
  <div class="ai-chat">
    <!-- Header -->
    <div class="chat-header">
      <div class="header-left">
        <div class="header-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span class="header-title">Chat</span>
      </div>
      <button @click="toggleChat" class="close-btn" title="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Messages -->
    <div class="chat-messages" ref="messagesContainer">
      <!-- Welcome state when no messages -->
      <div v-if="messages.length === 0 && !isLoading" class="welcome-state">
        <div class="welcome-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <h3>Chat about this note</h3>
        <p>Get insights, summaries, and answers from your content</p>
      </div>

      <!-- Messages list -->
      <template v-else>
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message', message.role]"
        >
          <div v-if="message.role === 'assistant'" class="message-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <div class="message-bubble">
            <div class="message-content">{{ message.content }}</div>
            <div v-if="message.sources" class="message-sources">
              <span class="sources-label">Sources:</span>
              <span v-for="source in message.sources" :key="source" class="source-tag">{{ source }}</span>
            </div>
            <!-- Apply Actions -->
            <div v-if="message.role === 'assistant'" class="message-actions">
              <button 
                @click="applyToNote('append', message.content)" 
                class="action-btn append" 
                title="Add to end of note"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Append
              </button>
              <button 
                @click="applyToNote('insert', message.content)" 
                class="action-btn insert" 
                title="Insert at cursor position"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 12L9 6M9 18l6-6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                </svg>
                Insert
              </button>
              <button 
                @click="applyToNote('replace', message.content)" 
                class="action-btn replace" 
                title="Replace entire note"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Replace
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Thinking indicator -->
      <div v-if="isLoading" class="thinking-indicator">
        <div class="thinking-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <div class="thinking-content">
          <div class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="thinking-text">Thinking...</span>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="chat-input-area">
      <!-- Mode tabs -->
      <div class="mode-tabs">
        <button :class="['mode-tab', { active: mode === 'chat' }]" @click="mode = 'chat'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat
        </button>
        <button :class="['mode-tab', { active: mode === 'transform' }]" @click="mode = 'transform'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v3M12 18v3M4.22 4.22l2.12 2.12M15.66 15.66l2.12 2.12M3 12h3M18 12h3M4.22 19.78l2.12-2.12M15.66 8.34l2.12-2.12"/>
          </svg>
          Transform
        </button>
      </div>

      <!-- Transform options -->
      <div v-if="mode === 'transform'" class="transform-options">
        <button
          v-for="opt in transformOptions"
          :key="opt.id"
          :class="['transform-chip', { active: selectedTransform === opt.id }]"
          @click="applyTransform(opt.id)"
        >
          <span class="transform-icon">{{ opt.icon }}</span>
          <span class="transform-label">{{ opt.label }}</span>
        </button>
      </div>

      <!-- Suggested prompts for chat mode -->
      <div class="suggested-prompts" v-if="mode === 'chat' && messages.length === 0">
        <button class="prompt-chip" @click="quickAction('summarize')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8"/>
          </svg>
          Summarize
        </button>
        <button class="prompt-chip" @click="quickAction('keypoints')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <circle cx="4" cy="6" r="1"/>
            <circle cx="4" cy="12" r="1"/>
            <circle cx="4" cy="18" r="1"/>
          </svg>
          Key points
        </button>
        <button class="prompt-chip" @click="quickAction('questions')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Suggest questions
        </button>
        <button class="prompt-chip" @click="quickAction('improve')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Improve writing
        </button>
      </div>

      <!-- Input form -->
      <form @submit.prevent="sendMessage" class="chat-form">
        <div class="input-wrapper">
          <input
            v-model="userInput"
            type="text"
            placeholder="Ask about this note..."
            :disabled="isLoading"
            ref="inputRef"
          >
          <button type="submit" class="send-btn" :disabled="isLoading || !userInput.trim()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue';
import { aiService } from '../services/ai.js';
import { ragService } from '../services/ragService.js';
import { storage } from '../services/storage.js';

const props = defineProps({
  noteId: {
    type: String,
    default: null
  },
  noteContent: {
    type: String,
    default: ''
  },
  notes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'updateNote']);

const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);
const inputRef = ref(null);
const mode = ref('chat');
const selectedTransform = ref(null);
const currentChatId = ref(null);

// Load chat history when noteId changes
watch(() => props.noteId, async (newId) => {
  if (newId) {
    await loadChatHistory(newId);
  } else {
    messages.value = [];
    currentChatId.value = null;
  }
}, { immediate: true });

async function loadChatHistory(id) {
  try {
    const chats = await storage.getChats(id);
    if (chats && chats.length > 0) {
      // Sort by updatedAt desc and take the first one
      const latestChat = chats.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      currentChatId.value = latestChat.id;
      messages.value = latestChat.messages || [];
      await scrollToBottom();
    } else {
      messages.value = [];
      currentChatId.value = null;
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
}

async function saveChatHistory() {
  if (!props.noteId) return;

  try {
    const chatData = {
      noteId: props.noteId,
      messages: messages.value
    };

    if (currentChatId.value) {
      await storage.updateChat(currentChatId.value, { messages: messages.value });
    } else {
      const newChat = await storage.saveChat(chatData);
      currentChatId.value = newChat.id;
    }
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

function applyToNote(type, content) {
  emit('updateNote', { type, content });
}

// Quick action prompts mapping
const quickPrompts = {
  summarize: 'Please summarize my notes and highlight the key takeaways.',
  keypoints: 'What are the main key points from my notes?',
  questions: 'Suggest some thought-provoking questions based on my notes.',
  improve: 'How can I improve the writing in my current note?'
};

// Transform options
const transformOptions = [
  { id: 'blog', icon: '📝', label: 'Blog Post' },
  { id: 'email', icon: '📧', label: 'Email' },
  { id: 'summary', icon: '📋', label: 'Summary' },
  { id: 'bullet', icon: '•', label: 'Bullets' },
  { id: 'action', icon: '✅', label: 'Actions' },
  { id: 'polish', icon: '✨', label: 'Polish' }
];

const transformPrompts = {
  blog: 'Transform this note into a well-structured blog post with an engaging introduction, clear body paragraphs, and a conclusion.',
  email: 'Transform this note into a professional email with a clear subject line, greeting, body, and call to action.',
  summary: 'Create a concise summary of this note. Highlight the key points and main takeaways.',
  bullet: 'Extract the key points from this note and present them as clear, actionable bullet points.',
  action: 'Extract all action items, tasks, and next steps from this note. Present them as a checklist.',
  polish: 'Improve the writing in this note. Fix grammar, enhance clarity, maintain the author\'s voice, and make it more engaging.'
};

async function quickAction(action) {
  const prompt = quickPrompts[action];
  if (prompt) {
    userInput.value = prompt;
    await sendMessage();
  }
}

async function applyTransform(transformId) {
  if (!props.noteContent) {
    messages.value.push({
      role: 'assistant',
      content: 'Please open a note first to use the transform feature.'
    });
    return;
  }

  selectedTransform.value = transformId;
  const prompt = transformPrompts[transformId];
  const transformName = transformOptions.find(o => o.id === transformId)?.label || 'Transform';

  messages.value.push({ role: 'user', content: `Transform to ${transformName}` });
  await saveChatHistory(); // Save user message
  
  isLoading.value = true;
  await scrollToBottom();

  try {
    const response = await aiService.chat([
      {
        role: 'system',
        content: 'You are a content transformation expert. Transform content according to the user\'s instructions while maintaining the core meaning and intent.'
      },
      {
        role: 'user',
        content: `${prompt}\n\nHere's the note to transform:\n\n${props.noteContent}`
      }
    ]);

    messages.value.push({
      role: 'assistant',
      content: response,
      isTransform: true
    });
    await saveChatHistory(); // Save assistant response
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Failed to transform. Please try again.'
    });
  } finally {
    isLoading.value = false;
    selectedTransform.value = null;
    await scrollToBottom();
  }
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isLoading.value) return;

  messages.value.push({ role: 'user', content: message });
  await saveChatHistory(); // Save user message

  userInput.value = '';
  isLoading.value = true;

  await scrollToBottom();

  try {
    let response;
    let sources = [];

    if (props.noteContent) {
      // Use RAG to find related notes and enhance the response
      const ragResult = await ragService.askAboutNote(
        props.noteId,
        props.noteContent,
        message
      );
      response = ragResult.content;
      sources = ragResult.hasContext
        ? ['Current note', ...ragResult.sources.map(s => s.noteTitle)]
        : ['Current note'];
    } else if (props.notes.length > 0) {
      // Use RAG for multi-note context
      const result = await ragService.askQuestion(message, { topK: 5 });
      response = result.content;
      sources = result.sources.map(s => s.noteTitle);
    } else {
      response = await aiService.chat([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message }
      ]);
    }

    messages.value.push({
      role: 'assistant',
      content: response,
      sources: sources.length > 0 ? sources : null
    });
    await saveChatHistory(); // Save assistant response
  } catch (error) {
    console.error('Chat error:', error);
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
    inputRef.value?.focus();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function toggleChat() {
  emit('close');
}

function clearChat() {
  messages.value = [];
  currentChatId.value = null;
  // Optionally delete from DB, but for now just clear view
}

defineExpose({ clearChat });
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border-light);
}

/* Header */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-radius: var(--radius-md);
  color: white;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--color-danger);
}

/* Messages area */
.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Welcome state */
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
  letter-spacing: -0.02em;
}

.welcome-state p {
  margin: var(--space-2) 0 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

/* Messages */
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

/* Sources */
.message-sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.sources-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

.source-tag {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-full);
}

/* Thinking indicator */
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

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.thinking-text {
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* Input area */
.chat-input-area {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding: 4px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.mode-tab {
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

.mode-tab:hover {
  color: var(--color-text-secondary);
}

.mode-tab.active {
  background: var(--color-bg-elevated);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* Transform options */
.transform-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.transform-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.transform-chip:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.08) 100%);
  border-color: rgba(245, 158, 11, 0.4);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.transform-chip.active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.15) 100%);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.transform-icon {
  font-size: 14px;
}

.transform-label {
  font-weight: 500;
}

/* Suggested prompts */
.suggested-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.prompt-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.prompt-chip:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary-light);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.prompt-chip:active {
  transform: translateY(0);
}

.prompt-chip svg {
  opacity: 0.7;
}

.prompt-chip:hover svg {
  opacity: 1;
}

/* Input form */
.chat-form {
  display: flex;
}

.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-wrapper input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
}

.input-wrapper input::placeholder {
  color: var(--color-text-tertiary);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: 4px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border-light);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn.append:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn.insert:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: #f59e0b;
  color: #f59e0b;
}

.action-btn.replace:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--color-danger);
  color: var(--color-danger);
}



.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Mobile */
@media (max-width: 768px) {
  .chat-header {
    padding: var(--space-3) var(--space-4);
  }

  .chat-messages {
    padding: var(--space-4);
  }

  .message {
    max-width: 95%;
  }

  .suggested-prompts {
    gap: var(--space-1);
  }

  .prompt-chip {
    font-size: 11px;
    padding: 6px 10px;
  }
}
</style>
