/**
 * AI Suggestion Service
 * Provides inline text suggestions with minimal context for token efficiency
 */

import { apiService } from './apiService.js';

// Debounce state
let debounceTimer = null;
let abortController = null;

/**
 * Get AI suggestion settings from localStorage
 */
export function getSettings() {
  const saved = localStorage.getItem('llm_settings');
  if (saved) {
    const parsed = JSON.parse(saved);
    return parsed.aiSuggestions || {
      enabled: false,
      triggerMode: 'smart',
      length: 'balanced'
    };
  }
  return {
    enabled: false,
    triggerMode: 'smart',
    length: 'balanced'
  };
}

/**
 * Extract minimal context from content around cursor
 * @param {string} content - Full document content
 * @param {number} cursorPos - Cursor position in the document
 * @returns {object} - Context object with paragraph and headings
 */
export function buildContext(content, cursorPos) {
  const lines = content.substring(0, cursorPos).split('\n');
  const allLines = content.split('\n');

  // Get current line and a few previous lines for context
  const currentLineIndex = lines.length - 1;
  const startLine = Math.max(0, currentLineIndex - 5);
  const contextLines = lines.slice(startLine);

  // Extract nearby headings (look up to 20 lines back)
  const headings = [];
  const headingStart = Math.max(0, currentLineIndex - 20);
  for (let i = headingStart; i < currentLineIndex; i++) {
    const line = allLines[i];
    if (line && line.match(/^#{1,3}\s+/)) {
      headings.push(line.replace(/^#+\s*/, '').trim());
    }
  }

  // Get the current paragraph (text since last empty line or heading)
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

  // Get the text on current line up to cursor
  const currentLine = lines[lines.length - 1] || '';

  return {
    paragraph: currentParagraph,
    currentLine,
    headings: headings.slice(-3), // Last 3 headings max
    endsWithPeriod: currentLine.trim().endsWith('.'),
    endsWithNewline: content.charAt(cursorPos - 1) === '\n'
  };
}

/**
 * Get max tokens based on length setting
 */
function getMaxTokens(length, context) {
  // After period or newline, allow more tokens for "generous" mode
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
 * Request a suggestion from the AI
 * @param {string} content - Full document content
 * @param {number} cursorPos - Cursor position
 * @param {object} options - Override settings
 * @returns {Promise<string>} - The suggestion text
 */
export async function getSuggestion(content, cursorPos, options = {}) {
  const settings = getSettings();
  const length = options.length || settings.length;

  // Cancel any pending request
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  const context = buildContext(content, cursorPos);

  // Don't suggest if line is empty and no context
  if (!context.paragraph.trim() && !context.headings.length) {
    return '';
  }

  const maxTokens = getMaxTokens(length, context);
  const prompt = buildPrompt(context, length);

  try {
    const response = await apiService.post('/api/ai/suggest', {
      prompt,
      maxTokens,
      context: {
        paragraph: context.paragraph,
        headings: context.headings
      }
    }, {
      signal: abortController.signal
    });

    if (response.suggestion) {
      // Clean up the suggestion
      let suggestion = response.suggestion.trim();

      // Remove any leading space if current line doesn't end with space
      const lastChar = context.currentLine.slice(-1);
      if (lastChar && lastChar !== ' ' && suggestion.startsWith(' ')) {
        // Keep the space, it's needed
      } else if (!lastChar || lastChar === ' ') {
        suggestion = suggestion.trimStart();
      }

      return suggestion;
    }

    return '';
  } catch (error) {
    if (error.name === 'AbortError') {
      return '';
    }
    console.error('Suggestion error:', error);
    return '';
  }
}

/**
 * Request suggestion with debouncing
 * @param {string} content - Full document content
 * @param {number} cursorPos - Cursor position
 * @param {number} delay - Debounce delay in ms
 * @param {function} callback - Called with suggestion result
 */
export function getSuggestionDebounced(content, cursorPos, delay, callback) {
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Cancel pending request
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
