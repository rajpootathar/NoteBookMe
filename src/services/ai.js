const API_BASE = import.meta.env.VITE_AI_API_URL || 'https://api.z.ai/api/coding/paas/v4';
const API_KEY = import.meta.env.VITE_AI_API_KEY;

export const aiService = {
  async chat(messages, options = {}) {
    if (!API_KEY) {
      throw new Error('AI API Key is missing. Please check your .env file.');
    }

    try {
      const response = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: options.model || import.meta.env.VITE_AI_MODEL_NAME || 'GLM-4.7',
          messages: messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          stream: options.stream ?? false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI service error:', error);
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
