/**
 * AI Service - High-level AI operations for the app
 * Uses llmProvider for all LLM calls
 */

import { llmProvider } from './llmProvider.js';

export const aiService = {
  /**
   * General chat completion
   */
  async chat(messages, options = {}) {
    return llmProvider.complete(messages, options);
  },

  /**
   * Chat about a specific note
   */
  async chatWithNote(noteContent, userMessage) {
    const systemPrompt = `You are a helpful assistant for note-taking and research.
The user has shared their note content with you. Help them by:
- Answering questions about their notes
- Summarizing and organizing information
- Suggesting improvements
- Helping them think through ideas
- Providing relevant insights

Keep responses concise and practical. If the user asks for help with writing, provide clear suggestions.`;

    return llmProvider.prompt(
      systemPrompt,
      `Here's my note:\n\n${noteContent}\n\n${userMessage}`
    );
  },

  /**
   * Summarize multiple notes
   */
  async summarizeNotes(notes) {
    const allContent = notes.map(n => `# ${n.title}\n${n.content}`).join('\n\n---\n\n');

    return llmProvider.prompt(
      'You are a helpful assistant. Provide clear, concise summaries of notes.',
      `Please summarize these notes:\n\n${allContent}`,
      { maxTokens: 1000 }
    );
  },

  /**
   * Improve writing quality
   */
  async improveWriting(text) {
    return llmProvider.prompt(
      'You are a writing assistant. Help improve clarity, grammar, and flow while maintaining the author\'s voice.',
      `Please help improve this text:\n\n${text}`
    );
  },

  /**
   * Generate ideas based on context
   */
  async generateIdeas(context) {
    return llmProvider.prompt(
      'You are a creative thinking partner. Help generate ideas and explore possibilities.',
      `Based on this context, help me brainstorm ideas:\n\n${context}`,
      { temperature: 0.9 }
    );
  },

  /**
   * Answer a question based on notes
   */
  async askQuestion(notes, question) {
    const notesContext = notes.map(n => `# ${n.title}\n${n.content}`).join('\n\n---\n\n');

    return llmProvider.prompt(
      'You are a knowledgeable assistant. Answer questions based on the provided notes context. If the answer isn\'t in the notes, say so clearly.',
      `Question: ${question}\n\nHere are my notes for context:\n\n${notesContext}`
    );
  }
};

export default aiService;
