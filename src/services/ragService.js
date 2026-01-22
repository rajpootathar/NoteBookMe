import { storage } from './storage.js';
import { aiService } from './ai.js';

/**
 * Frontend RAG Service
 * Handles communication with the backend RAG API and AI integration
 */
export const ragService = {
  /**
   * Perform semantic search across notes
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @param {string} notebookId - Optional notebook filter
   * @returns {Promise<Array>} - Search results with scores
   */
  async semanticSearch(query, topK = 5, notebookId = null) {
    return storage.request('/api/search/semantic', {
      method: 'POST',
      body: JSON.stringify({ query, topK, notebookId })
    });
  },

  /**
   * Get RAG context for a question
   * @param {string} question - User's question
   * @param {number} topK - Number of sources to include
   * @param {string} notebookId - Optional notebook filter
   * @returns {Promise<object>} - RAG context with sources
   */
  async getRAGContext(question, topK = 5, notebookId = null) {
    return storage.request('/api/ai/rag', {
      method: 'POST',
      body: JSON.stringify({ question, topK, notebookId })
    });
  },

  /**
   * Chat with AI using RAG-enhanced context
   * @param {string} question - User's question
   * @param {Array} conversationHistory - Previous messages
   * @param {object} options - Options for RAG and AI
   * @returns {Promise<object>} - AI response with sources
   */
  async chatWithRAG(question, conversationHistory = [], options = {}) {
    const { topK = 5, notebookId = null } = options;

    // Get RAG context from backend
    const ragContext = await this.getRAGContext(question, topK, notebookId);

    // Build messages with RAG context
    const messages = [
      { role: 'system', content: ragContext.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: question }
    ];

    // Get AI response
    const response = await aiService.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000
    });

    return {
      content: response,
      sources: ragContext.sources,
      hasContext: ragContext.hasContext,
      citations: ragContext.citations
    };
  },

  /**
   * Ask a question with RAG and get a formatted response
   * @param {string} question - User's question
   * @param {object} options - Options
   * @returns {Promise<object>} - Response with content and sources
   */
  async askQuestion(question, options = {}) {
    try {
      const result = await this.chatWithRAG(question, [], options);

      // If the AI response doesn't include sources formatting, add it
      let content = result.content;
      if (result.hasContext && result.sources.length > 0 && !content.includes('Sources:')) {
        content += result.citations;
      }

      return {
        content,
        sources: result.sources,
        success: true
      };
    } catch (error) {
      console.error('RAG question error:', error);
      return {
        content: 'Sorry, I encountered an error while searching your notes. Please try again.',
        sources: [],
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Summarize notes using RAG
   * @param {string} topic - Topic to summarize (optional)
   * @param {string} notebookId - Notebook to summarize (optional)
   * @returns {Promise<object>} - Summary with sources
   */
  async summarizeNotes(topic = null, notebookId = null) {
    const question = topic
      ? `Summarize my notes about ${topic}`
      : 'Summarize all my notes and highlight the main themes and key points';

    return this.askQuestion(question, { topK: 10, notebookId });
  },

  /**
   * Find connections between notes
   * @param {string} notebookId - Optional notebook filter
   * @returns {Promise<object>} - Connections analysis with sources
   */
  async findConnections(notebookId = null) {
    const question = 'What connections, patterns, and relationships can you find between my notes? List the key themes and how they relate.';
    return this.askQuestion(question, { topK: 10, notebookId });
  },

  /**
   * Generate ideas based on notes
   * @param {string} context - Optional additional context
   * @param {string} notebookId - Optional notebook filter
   * @returns {Promise<object>} - Ideas with sources
   */
  async generateIdeas(context = null, notebookId = null) {
    const question = context
      ? `Based on my notes and this context: "${context}", suggest creative ideas and next steps.`
      : 'Based on my notes, suggest creative ideas, improvements, and next steps I should consider.';

    return this.askQuestion(question, { topK: 8, notebookId });
  },

  /**
   * Answer a question about a specific note with broader context
   * @param {string} noteId - The note being discussed
   * @param {string} noteContent - Current note content
   * @param {string} question - User's question
   * @returns {Promise<object>} - Response with sources
   */
  async askAboutNote(noteId, noteContent, question) {
    // First get related notes via RAG
    const ragContext = await this.getRAGContext(question, 5, null);

    // Build a combined prompt
    const systemPrompt = `You are a helpful assistant for note-taking and research.
The user is currently working on a note and asking a question.

CURRENT NOTE:
${noteContent}

${ragContext.hasContext ? `RELATED NOTES FROM THEIR COLLECTION:
${ragContext.context}` : ''}

Help the user by:
- Answering questions about their current note
- Drawing connections to related notes if relevant
- Providing practical suggestions
- Citing sources using [1], [2], etc. when referencing related notes`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];

    const response = await aiService.chat(messages);

    return {
      content: response,
      sources: ragContext.sources,
      hasContext: ragContext.hasContext
    };
  },

  /**
   * Format sources for display
   * @param {Array} sources - Array of source objects
   * @returns {Array} - Formatted sources for UI
   */
  formatSourcesForUI(sources) {
    return sources.map(source => ({
      index: source.index,
      title: source.noteTitle,
      noteId: source.noteId,
      tags: source.tags || [],
      relevance: Math.round((source.score || 0) * 100)
    }));
  }
};
