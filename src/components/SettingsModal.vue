<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <div class="settings-modal">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="close-btn" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="settings-body">
        <section class="settings-section">
          <h3>LLM Configuration</h3>
          <p class="section-desc">Configure your AI provider for chat and content generation.</p>

          <div class="form-group">
            <label>Provider</label>
            <select v-model="settings.provider" @change="onProviderChange">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Claude (Anthropic)</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
              <option value="together">Together AI</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div class="form-group">
            <label>API Endpoint</label>
            <input
              type="url"
              v-model="settings.endpoint"
              placeholder="https://api.openai.com/v1"
              :disabled="settings.provider !== 'custom' && settings.provider !== 'ollama'"
            />
            <span class="form-hint" v-if="settings.provider !== 'custom'">Auto-filled based on provider</span>
          </div>

          <div class="form-group" v-if="settings.provider !== 'ollama'">
            <label>API Key</label>
            <div class="input-with-toggle">
              <input
                :type="showApiKey ? 'text' : 'password'"
                v-model="settings.apiKey"
                placeholder="sk-..."
              />
              <button class="toggle-visibility" @click="showApiKey = !showApiKey" type="button">
                <svg v-if="showApiKey" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Model Name</label>
            <input
              type="text"
              v-model="settings.model"
              :placeholder="getModelPlaceholder()"
            />
            <span class="form-hint">{{ getModelHint() }}</span>
          </div>
        </section>

        <div class="test-connection">
          <button
            class="test-btn"
            @click="testConnection"
            :disabled="isTesting || !canTest"
          >
            <span v-if="isTesting" class="spinner"></span>
            <span v-else>Test Connection</span>
          </button>
          <span v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
            {{ testResult.message }}
          </span>
        </div>

        <section class="settings-section" style="margin-top: var(--space-5);">
          <h3>AI Writing Assistance</h3>
          <p class="section-desc">Get intelligent suggestions as you write. Uses tokens from your configured provider.</p>

          <div class="form-group">
            <label class="toggle-label">
              <span>Enable inline suggestions</span>
              <button
                type="button"
                :class="['toggle-switch', { active: settings.aiSuggestions.enabled }]"
                @click="settings.aiSuggestions.enabled = !settings.aiSuggestions.enabled"
              >
                <span class="toggle-knob"></span>
              </button>
            </label>
          </div>

          <div class="form-group" v-if="settings.aiSuggestions.enabled">
            <label>Trigger Mode</label>
            <select v-model="settings.aiSuggestions.triggerMode">
              <option value="manual">Manual (Ctrl+Space)</option>
              <option value="smart">Smart (on pause)</option>
              <option value="full">Full automatic</option>
            </select>
            <span class="form-hint">{{ getTriggerModeHint() }}</span>
          </div>

          <div class="form-group" v-if="settings.aiSuggestions.enabled">
            <label>Suggestion Length</label>
            <select v-model="settings.aiSuggestions.length">
              <option value="minimal">Minimal (few words)</option>
              <option value="balanced">Balanced (sentence)</option>
              <option value="generous">Generous (next sentence)</option>
            </select>
            <span class="form-hint">{{ getLengthHint() }}</span>
          </div>
        </section>
      </div>

      <div class="settings-footer">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="saveSettings" :disabled="!hasChanges">
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

const emit = defineEmits(['close', 'saved']);

const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  together: 'https://api.together.xyz/v1',
  ollama: 'http://localhost:11434/v1',
  custom: ''
};

const PROVIDER_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash',
  groq: 'llama-3.1-70b-versatile',
  openrouter: 'anthropic/claude-3.5-sonnet',
  together: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  ollama: 'llama3.2',
  custom: ''
};

const showApiKey = ref(false);
const isTesting = ref(false);
const testResult = ref(null);
const originalSettings = ref(null);

const settings = reactive({
  provider: 'openai',
  endpoint: '',
  apiKey: '',
  model: '',
  // AI Writing Assistance
  aiSuggestions: {
    enabled: false,
    triggerMode: 'smart', // 'manual' | 'smart' | 'full'
    length: 'balanced'    // 'minimal' | 'balanced' | 'generous'
  }
});

const canTest = computed(() => {
  if (settings.provider === 'ollama') {
    return settings.endpoint && settings.model;
  }
  return settings.endpoint && settings.apiKey && settings.model;
});

const hasChanges = computed(() => {
  if (!originalSettings.value) return false;
  return JSON.stringify(settings) !== JSON.stringify(originalSettings.value);
});

function loadSettings() {
  const saved = localStorage.getItem('llm_settings');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Handle legacy settings without aiSuggestions
    if (!parsed.aiSuggestions) {
      parsed.aiSuggestions = {
        enabled: false,
        triggerMode: 'smart',
        length: 'balanced'
      };
    }
    Object.assign(settings, parsed);
  } else {
    // Default settings
    settings.provider = 'openai';
    settings.endpoint = PROVIDER_ENDPOINTS.openai;
    settings.model = PROVIDER_MODELS.openai;
    settings.aiSuggestions = {
      enabled: false,
      triggerMode: 'smart',
      length: 'balanced'
    };
  }
  originalSettings.value = JSON.parse(JSON.stringify(settings));
}

function onProviderChange() {
  settings.endpoint = PROVIDER_ENDPOINTS[settings.provider] || '';
  settings.model = PROVIDER_MODELS[settings.provider] || '';
  testResult.value = null;
}

function getModelPlaceholder() {
  return PROVIDER_MODELS[settings.provider] || 'model-name';
}

function getModelHint() {
  const hints = {
    openai: 'e.g., gpt-4o, gpt-4o-mini, gpt-3.5-turbo',
    anthropic: 'e.g., claude-sonnet-4-20250514, claude-3-5-sonnet-20241022',
    gemini: 'e.g., gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash',
    groq: 'e.g., llama-3.1-70b-versatile, mixtral-8x7b-32768',
    openrouter: 'e.g., anthropic/claude-3.5-sonnet, openai/gpt-4o',
    together: 'e.g., meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    ollama: 'e.g., llama3.2, mistral, codellama',
    custom: 'Enter the model name for your API'
  };
  return hints[settings.provider] || '';
}

function getTriggerModeHint() {
  const hints = {
    manual: 'Press Ctrl+Space to request a suggestion. Most token-efficient.',
    smart: 'Suggestions appear after you pause typing (1-2 seconds). Balanced.',
    full: 'Suggestions appear as you type with debouncing. Uses most tokens.'
  };
  return hints[settings.aiSuggestions.triggerMode] || '';
}

function getLengthHint() {
  const hints = {
    minimal: 'Just a few words to complete your current thought.',
    balanced: 'Complete your sentence naturally.',
    generous: 'Suggests the next sentence after you finish one.'
  };
  return hints[settings.aiSuggestions.length] || '';
}

async function testConnection() {
  isTesting.value = true;
  testResult.value = null;

  try {
    let response;

    if (settings.provider === 'anthropic') {
      // Claude/Anthropic has a different API format
      response = await fetch(`${settings.endpoint}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
    } else {
      // OpenAI-compatible API
      response = await fetch(`${settings.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` })
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });
    }

    if (response.ok) {
      testResult.value = { success: true, message: 'Connection successful!' };
    } else {
      const error = await response.json().catch(() => ({}));
      testResult.value = {
        success: false,
        message: error.error?.message || `Error: ${response.status}`
      };
    }
  } catch (err) {
    testResult.value = {
      success: false,
      message: err.message || 'Connection failed'
    };
  } finally {
    isTesting.value = false;
  }
}

function saveSettings() {
  localStorage.setItem('llm_settings', JSON.stringify(settings));
  originalSettings.value = { ...settings };
  emit('saved', settings);
  emit('close');
}

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.settings-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.settings-section {
  margin-bottom: var(--space-5);
}

.settings-section h3 {
  margin: 0 0 var(--space-1) 0;
  font-size: 15px;
  font-weight: 600;
}

.section-desc {
  margin: 0 0 var(--space-4) 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: all 0.15s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled {
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.form-hint {
  display: block;
  margin-top: var(--space-1);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.input-with-toggle {
  position: relative;
  display: flex;
}

.input-with-toggle input {
  padding-right: 40px;
}

.toggle-visibility {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-visibility:hover {
  color: var(--color-text-secondary);
}

.test-connection {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.test-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 130px;
}

.test-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.test-result {
  font-size: 13px;
  font-weight: 500;
}

.test-result.success {
  color: var(--color-success);
}

.test-result.error {
  color: var(--color-danger);
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary);
}

.btn-primary {
  padding: var(--space-2) var(--space-4);
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.toggle-label span {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.toggle-switch:hover {
  border-color: var(--color-primary);
}

.toggle-switch.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  border-color: var(--color-primary);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
}
</style>
