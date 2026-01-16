<template>
  <div class="global-ai-chat">
    <div class="chat-header">
      <div>
        <h3>🤖 AI Assistant</h3>
        <p class="chat-subtitle">I can see all your notes! Ask me anything.</p>
      </div>
      <button @click="emit('close')" class="close-btn">×</button>
    </div>

    <div class="quick-actions">
      <button @click="summarizeAll" class="action-btn">
        📝 Summarize All Notes
      </button>
      <button @click="askQuestion" class="action-btn">
        ❓ Ask a Question
      </button>
      <button @click="generateIdeas" class="action-btn">
        💡 Generate Ideas
      </button>
      <button @click="findConnections" class="action-btn">
        🔗 Find Connections
      </button>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="message-content">{{ message.content }}</div>
      </div>
      <div v-if="isLoading" class="message assistant">
        <div class="message-content typing">Thinking...</div>
      </div>
    </div>

    <div class="chat-prompt-container">
      <div class="prompt-suggestions" v-if="messages.length === 0">
        <span>Try:</span>
        <button @click="setPrompt('What are my main themes?')">What are my main themes?</button>
        <button @click="setPrompt('Summarize everything')">Summarize everything</button>
        <button @click="setPrompt('What should I work on?')">What should I work on?</button>
      </div>
      <form @submit.prevent="sendMessage" class="chat-input">
        <input
          v-model="userInput"
          type="text"
          placeholder="Ask about your notes..."
          :disabled="isLoading"
        >
        <button type="submit" :disabled="isLoading || !userInput.trim()">
          Send
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { aiService } from '../services/ai.js';

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close']);

const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);

const notesContext = ref('');

// Update notes context when notes change
async function updateNotesContext() {
  if (props.notes.length === 0) {
    notesContext.value = 'No notes yet.';
    return;
  }

  notesContext.value = props.notes.map(n => `# ${n.title}\n${n.content}`).join('\n\n---\n\n');
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isLoading.value) return;

  messages.value.push({ role: 'user', content: message });
  userInput.value = '';
  isLoading.value = true;

  await scrollToBottom();

  try {
    await updateNotesContext();

    const systemPrompt = `You are a helpful assistant for note-taking and research.
The user has shared ALL their notes with you. Help them by:
- Answering questions about ANY of their notes
- Finding connections between notes
- Summarizing themes and patterns
- Providing insights based on their complete knowledge base
- Suggesting improvements and new ideas

Keep responses concise but thorough. If referencing specific notes, mention the note titles.

Here are ALL the user's notes:
${notesContext.value}`;

    const response = await aiService.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]);

    messages.value.push({ role: 'assistant', content: response });
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
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

  messages.value.push({ role: 'user', content: 'Please summarize all my notes and highlight the main themes.' });
  isLoading.value = true;
  await scrollToBottom();

  try {
    await updateNotesContext();
    const summary = await aiService.summarizeNotes(props.notes);
    messages.value.push({ role: 'assistant', content: summary });
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
  messages.value.push({ role: 'user', content: 'Based on all my notes, what ideas or improvements can you suggest?' });
  isLoading.value = true;
  await scrollToBottom();

  try {
    await updateNotesContext();
    const ideas = await aiService.generateIdeas(notesContext.value);
    messages.value.push({ role: 'assistant', content: ideas });
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
    await updateNotesContext();
    const response = await aiService.chat([
      {
        role: 'system',
        content: 'You are an analytical assistant. Find connections, patterns, and themes across multiple notes. Be specific about which notes relate to each other.'
      },
      {
        role: 'user',
        content: `What connections and themes can you find between these notes?\n\n${notesContext.value}`
      }
    ]);
    messages.value.push({ role: 'assistant', content: response });
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

.chat-header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
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
  font-size: 22px;
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
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.action-btn {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.action-btn:hover::before {
  opacity: 1;
}

.action-btn:nth-child(1):hover {
  border-color: #6366f1;
}

.action-btn:nth-child(2):hover {
  border-color: #f59e0b;
}

.action-btn:nth-child(3):hover {
  border-color: #10b981;
}

.action-btn:nth-child(4):hover {
  border-color: #06b6d4;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background:
    radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
    var(--color-bg-primary);
}

.message {
  max-width: 85%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  line-height: 1.6;
  font-size: 14px;
  animation: messageSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message.user {
  align-self: flex-end;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-bottom-right-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.message.assistant {
  align-self: flex-start;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-bottom-left-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.message-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-content.typing {
  color: var(--color-primary);
  font-style: italic;
  animation: typingPulse 1.5s infinite;
}

@keyframes typingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
  border: 1px solid var(--color-border);
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

.chat-input button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.chat-input button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.chat-input button:active:not(:disabled) {
  transform: translateY(0);
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
