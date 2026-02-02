/**
 * LLM Provider - Single source of truth for all AI/LLM calls
 * All services should use this for AI operations
 */

// ============ Settings Management ============

const getAuthToken = () => localStorage.getItem('auth_token');

/**
 * Get LLM settings from localStorage
 */
export function getSettings() {
  const saved = localStorage.getItem('llm_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Get AI suggestion settings
 */
export function getSuggestionSettings() {
  const settings = getSettings();
  if (settings?.aiSuggestions) {
    return settings.aiSuggestions;
  }
  return {
    enabled: false,
    triggerMode: 'smart',
    length: 'balanced'
  };
}

/**
 * Check if LLM is properly configured
 */
export function isConfigured() {
  const settings = getSettings();
  return settings && settings.endpoint && settings.model &&
         (settings.provider === 'ollama' || settings.apiKey);
}

// ============ Rate Limiting ============

let lastRequestTime = 0;
let cooldownUntil = 0;
const MIN_REQUEST_INTERVAL = 2000;  // 2 seconds between requests
const ERROR_COOLDOWN = 10000;       // 10 second cooldown after errors

/**
 * Check if we can make a request (rate limiting)
 */
export function canMakeRequest() {
  const now = Date.now();
  if (now < cooldownUntil) return false;
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) return false;
  return true;
}

/**
 * Set error cooldown (call after rate limit errors)
 */
export function setErrorCooldown() {
  cooldownUntil = Date.now() + ERROR_COOLDOWN;
}

/**
 * Record request time
 */
function recordRequest() {
  lastRequestTime = Date.now();
}

// ============ Provider-Specific Handlers ============

/**
 * Build headers for API request
 */
function buildHeaders(settings) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (settings.provider === 'anthropic') {
    headers['x-api-key'] = settings.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (settings.apiKey && settings.provider !== 'ollama') {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  // OpenRouter requires additional headers
  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'NotebookME';
  }

  return headers;
}

/**
 * Call OpenAI-compatible API (OpenAI, Gemini, Groq, Together, Ollama, etc.)
 */
async function callOpenAICompatible(settings, messages, options, signal) {
  const response = await fetch(`${settings.endpoint}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(settings),
    signal,
    body: JSON.stringify({
      model: options.model || settings.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      ...(options.stream !== undefined && { stream: options.stream })
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    if (response.status === 429) {
      setErrorCooldown();
    }
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call Anthropic API (different format)
 */
async function callAnthropic(settings, messages, options, signal) {
  // Extract system message
  let systemPrompt = '';
  const chatMessages = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else {
      chatMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
  }

  const body = {
    model: options.model || settings.model,
    max_tokens: options.maxTokens ?? 2000,
    messages: chatMessages
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  const response = await fetch(`${settings.endpoint}/v1/messages`, {
    method: 'POST',
    headers: buildHeaders(settings),
    signal,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    if (response.status === 429) {
      setErrorCooldown();
    }
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.content?.find(c => c.type === 'text');
  return textContent?.text || '';
}

/**
 * Call backend proxy (fallback when no custom settings)
 */
async function callProxy(messages, options) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in or configure LLM settings.');
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages,
      options: {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2000,
        model: options.model
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content;
}

// ============ Main API ============

/**
 * Complete a chat - main entry point for all LLM calls
 * @param {Array} messages - Array of {role, content} messages
 * @param {Object} options - {temperature, maxTokens, model, signal, rateLimit}
 * @returns {Promise<string>} - The completion text
 */
export async function complete(messages, options = {}) {
  const settings = getSettings();

  // Use direct API if configured, otherwise fallback to proxy
  if (isConfigured()) {
    // Check rate limiting if requested
    if (options.rateLimit && !canMakeRequest()) {
      throw new Error('Rate limited - please wait');
    }

    if (options.rateLimit) {
      recordRequest();
    }

    if (settings.provider === 'anthropic') {
      return callAnthropic(settings, messages, options, options.signal);
    }

    return callOpenAICompatible(settings, messages, options, options.signal);
  }

  // Fallback to backend proxy
  return callProxy(messages, options);
}

/**
 * Simple completion with just a prompt (convenience method)
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message
 * @param {Object} options - Same as complete()
 */
export async function prompt(systemPrompt, userPrompt, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  return complete(messages, options);
}

// ============ Export ============

export const llmProvider = {
  // Settings
  getSettings,
  getSuggestionSettings,
  isConfigured,

  // Rate limiting
  canMakeRequest,
  setErrorCooldown,

  // Main API
  complete,
  prompt
};

export default llmProvider;
