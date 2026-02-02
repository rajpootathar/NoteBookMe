/**
 * AI Suggestion Service
 * Provides inline text suggestions using frontend settings (same as chat)
 */

// Debounce state
let debounceTimer = null;
let abortController = null;

// Rate limiting
let lastRequestTime = 0;
let cooldownUntil = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
const ERROR_COOLDOWN = 10000;      // 10 second cooldown after errors

/**
 * Get LLM settings from localStorage
 */
function getLLMSettings() {
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
 * Get AI suggestion settings from localStorage
 */
export function getSettings() {
  const llmSettings = getLLMSettings();
  if (llmSettings?.aiSuggestions) {
    return llmSettings.aiSuggestions;
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
function hasLLMConfig() {
  const settings = getLLMSettings();
  return settings && settings.endpoint && settings.model &&
         (settings.provider === 'ollama' || settings.apiKey);
}

/**
 * Extract minimal context from content around cursor
 */
export function buildContext(content, cursorPos) {
  const lines = content.substring(0, cursorPos).split('\n');
  const allLines = content.split('\n');

  const currentLineIndex = lines.length - 1;
  const startLine = Math.max(0, currentLineIndex - 5);
  const contextLines = lines.slice(startLine);

  // Extract nearby headings
  const headings = [];
  const headingStart = Math.max(0, currentLineIndex - 20);
  for (let i = headingStart; i < currentLineIndex; i++) {
    const line = allLines[i];
    if (line && line.match(/^#{1,3}\s+/)) {
      headings.push(line.replace(/^#+\s*/, '').trim());
    }
  }

  // Get current paragraph
  let paragraphStart = contextLines.length - 1;
  for (let i = contextLines.length - 1; i >= 0; i--) {
    const line = contextLines[i];
    if (line.trim() === '' || line.match(/^#{1,3}\s+/)) {
      paragraphStart = i + 1;
      break;
    }
    if (i === 0) paragraphStart = 0;
  }

  const currentParagraph = contextLines.slice(paragraphStart).join('\n');
  const currentLine = lines[lines.length - 1] || '';

  return {
    paragraph: currentParagraph,
    currentLine,
    headings: headings.slice(-3),
    endsWithPeriod: currentLine.trim().endsWith('.'),
    endsWithNewline: content.charAt(cursorPos - 1) === '\n'
  };
}

/**
 * Get max tokens based on length setting
 */
function getMaxTokens(length, context) {
  const afterSentence = context.endsWithPeriod || context.endsWithNewline;

  switch (length) {
    case 'minimal':
      return 15;
    case 'balanced':
      return afterSentence ? 30 : 20;
    case 'generous':
      return afterSentence ? 50 : 30;
    default:
      return 20;
  }
}

/**
 * Build the prompt for the AI
 */
function buildPrompt(context, length) {
  const headingContext = context.headings.length > 0
    ? `Current section: ${context.headings.join(' > ')}\n`
    : '';

  let instruction = '';
  switch (length) {
    case 'minimal':
      instruction = 'Complete with just a few words (3-5 words max).';
      break;
    case 'balanced':
      instruction = 'Complete the current thought naturally (one sentence max).';
      break;
    case 'generous':
      if (context.endsWithPeriod) {
        instruction = 'Suggest the next sentence that would naturally follow.';
      } else {
        instruction = 'Complete the current sentence naturally.';
      }
      break;
  }

  return `You are a writing assistant. Complete the user's text naturally.
${headingContext}
Rules:
- ${instruction}
- Match the writing style and tone
- Don't repeat what's already written
- Return ONLY the completion text, nothing else
- If the text seems complete, return empty string

Text to complete:
${context.paragraph}`;
}

/**
 * Call the AI directly using frontend settings
 */
async function callAI(prompt, maxTokens, signal) {
  const settings = getLLMSettings();

  if (!settings || !settings.endpoint || !settings.model) {
    throw new Error('LLM not configured');
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  // Add API key if not Ollama
  if (settings.apiKey && settings.provider !== 'ollama') {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  // OpenRouter requires additional headers
  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'NotebookME';
  }

  // Handle Anthropic separately (different API format)
  if (settings.provider === 'anthropic') {
    return callAnthropicAI(settings, prompt, maxTokens, signal);
  }

  const response = await fetch(`${settings.endpoint}/chat/completions`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: 'You are a concise writing assistant. Provide only the completion text, no explanations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: Math.min(maxTokens, 100)
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    const errorMsg = error.error?.message || `API error: ${response.status}`;

    // Set cooldown on rate limit errors
    if (response.status === 429) {
      cooldownUntil = Date.now() + ERROR_COOLDOWN;
    }

    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Call Anthropic API (different format)
 */
async function callAnthropicAI(settings, prompt, maxTokens, signal) {
  const response = await fetch(`${settings.endpoint}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    signal,
    body: JSON.stringify({
      model: settings.model,
      max_tokens: Math.min(maxTokens, 100),
      system: 'You are a concise writing assistant. Provide only the completion text, no explanations.',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    if (response.status === 429) {
      cooldownUntil = Date.now() + ERROR_COOLDOWN;
    }
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || '';
}

/**
 * Request a suggestion from the AI
 */
export async function getSuggestion(content, cursorPos, options = {}) {
  const aiSettings = getSettings();
  const length = options.length || aiSettings.length;

  // Check rate limiting
  const now = Date.now();
  if (now < cooldownUntil) {
    console.log('Suggestion skipped: in cooldown');
    return '';
  }
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log('Suggestion skipped: too soon');
    return '';
  }

  // Check if LLM is configured
  if (!hasLLMConfig()) {
    console.log('Suggestion skipped: LLM not configured');
    return '';
  }

  // Cancel any pending request
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  const context = buildContext(content, cursorPos);

  // Don't suggest if no context
  if (!context.paragraph.trim() && !context.headings.length) {
    return '';
  }

  const maxTokens = getMaxTokens(length, context);
  const prompt = buildPrompt(context, length);

  try {
    lastRequestTime = Date.now();
    const suggestion = await callAI(prompt, maxTokens, abortController.signal);

    // Clean up suggestion
    let result = suggestion.trim();

    // Add leading space if needed
    const lastChar = context.currentLine.slice(-1);
    if (lastChar && lastChar !== ' ' && result && !result.startsWith(' ')) {
      result = ' ' + result;
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      return '';
    }
    console.error('Suggestion error:', error.message);
    return '';
  }
}

/**
 * Request suggestion with debouncing
 */
export function getSuggestionDebounced(content, cursorPos, delay, callback) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  debounceTimer = setTimeout(async () => {
    const suggestion = await getSuggestion(content, cursorPos);
    callback(suggestion);
  }, delay);
}

/**
 * Cancel any pending suggestion request
 */
export function cancelSuggestion() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

export const suggestionService = {
  getSettings,
  buildContext,
  getSuggestion,
  getSuggestionDebounced,
  cancelSuggestion
};
