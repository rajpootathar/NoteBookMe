// AI service - supports both backend proxy and direct LLM API calls
const getAuthToken = () => localStorage.getItem('auth_token');

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

function hasCustomLLMSettings() {
  const settings = getLLMSettings();
  return settings && settings.endpoint && settings.model &&
         (settings.provider === 'ollama' || settings.apiKey);
}

export const aiService = {
  async chat(messages, options = {}) {
    // Check if user has configured custom LLM settings
    const llmSettings = getLLMSettings();

    if (hasCustomLLMSettings()) {
      // Use direct API call to user's configured endpoint
      return this.chatDirect(messages, options, llmSettings);
    }

    // Fall back to backend proxy
    return this.chatProxy(messages, options);
  },

  async chatDirect(messages, options = {}, settings) {
    // Use Claude-specific handler for Anthropic
    if (settings.provider === 'anthropic') {
      return this.chatClaude(messages, options, settings);
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add API key if not using Ollama
      if (settings.apiKey && settings.provider !== 'ollama') {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      // OpenRouter requires additional headers
      if (settings.provider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'NotebookME';
      }

      const response = await fetch(`${settings.endpoint}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: options.model || settings.model,
          messages: messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Direct LLM API error:', error);
      throw error;
    }
  },

  // Claude/Anthropic has a different API format
  async chatClaude(messages, options = {}, settings) {
    try {
      // Extract system message if present
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

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01'
      };

      const body = {
        model: options.model || settings.model,
        max_tokens: options.maxTokens ?? 2000,
        messages: chatMessages
      };

      // Add system prompt if present
      if (systemPrompt) {
        body.system = systemPrompt;
      }

      // Add temperature if specified
      if (options.temperature !== undefined) {
        body.temperature = options.temperature;
      }

      const response = await fetch(`${settings.endpoint}/v1/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      // Claude returns content as an array of content blocks
      const textContent = data.content?.find(c => c.type === 'text');
      return textContent?.text || '';
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  },

  async chatProxy(messages, options = {}) {
    try {
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
          messages: messages,
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
    } catch (error) {
      console.error('AI proxy error:', error);
      throw error;
    }
  },

  async chatWithNote(noteContent, userMessage) {
    const systemPrompt = `You are a helpful assistant for note-taking and research.
The user has shared their note content with you. Help them by:
- Answering questions about their notes
- Summarizing and organizing information
- Suggesting improvements
- Helping them think through ideas
- Providing relevant insights

Keep responses concise and practical. If the user asks for help with writing, provide clear suggestions.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here's my note:\n\n${noteContent}\n\n${userMessage}` }
    ];

    return this.chat(messages);
  },

  async summarizeNotes(notes) {
    const allContent = notes.map(n => `# ${n.title}\n${n.content}`).join('\n\n---\n\n');
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant. Provide clear, concise summaries of notes.'
      },
      {
        role: 'user',
        content: `Please summarize these notes:\n\n${allContent}`
      }
    ];

    return this.chat(messages, { maxTokens: 1000 });
  },

  async improveWriting(text) {
    const messages = [
      {
        role: 'system',
        content: 'You are a writing assistant. Help improve clarity, grammar, and flow while maintaining the author\'s voice.'
      },
      {
        role: 'user',
        content: `Please help improve this text:\n\n${text}`
      }
    ];

    return this.chat(messages);
  },

  async generateIdeas(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are a creative thinking partner. Help generate ideas and explore possibilities.'
      },
      {
        role: 'user',
        content: `Based on this context, help me brainstorm ideas:\n\n${context}`
      }
    ];

    return this.chat(messages, { temperature: 0.9 });
  },

  async askQuestion(notes, question) {
    const notesContext = notes.map(n => `# ${n.title}\n${n.content}`).join('\n\n---\n\n');
    const messages = [
      {
        role: 'system',
        content: 'You are a knowledgeable assistant. Answer questions based on the provided notes context. If the answer isn\'t in the notes, say so clearly.'
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nHere are my notes for context:\n\n${notesContext}`
      }
    ];

    return this.chat(messages);
  }
};
