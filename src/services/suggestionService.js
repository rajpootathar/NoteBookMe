/**
 * AI Suggestion Service - Inline text suggestions
 * Uses llmProvider for all LLM calls
 */

import { llmProvider } from './llmProvider.js';

// Debounce state
let debounceTimer = null;
let abortController = null;

/**
 * Get suggestion settings (convenience re-export)
 */
export function getSettings() {
  return llmProvider.getSuggestionSettings();
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

  // Minimum 50 tokens - some models (like Gemini) don't work well with very low limits
  switch (length) {
    case 'minimal':
      return 50;
    case 'balanced':
      return afterSentence ? 80 : 60;
    case 'generous':
      return afterSentence ? 120 : 80;
    default:
      return 60;
  }
}

/**
 * Build the prompt for completion
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

  return {
    system: `You are a writing assistant. Complete the user's text naturally.
${headingContext}
Rules:
- ${instruction}
- Match the writing style and tone
- Don't repeat what's already written
- Return ONLY the completion text, nothing else
- If the text seems complete, return empty string`,
    user: `Text to complete:\n${context.paragraph}`
  };
}

/**
 * Request a suggestion from the AI
 */
export async function getSuggestion(content, cursorPos, options = {}) {
  const settings = getSettings();
  const length = options.length || settings.length;

  // Check if configured and rate limiting
  if (!llmProvider.isConfigured()) {
    console.log('Suggestion skipped: LLM not configured');
    return '';
  }

  if (!llmProvider.canMakeRequest()) {
    console.log('Suggestion skipped: rate limited');
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
    const suggestion = await llmProvider.prompt(
      prompt.system,
      prompt.user,
      {
        maxTokens,
        temperature: 0.7,
        signal: abortController.signal,
        rateLimit: true
      }
    );

    // Clean up suggestion
    let result = (suggestion || '').trim();

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

export default suggestionService;
