import { generateEmbedding } from './embeddingService.js';
import { searchNotesByVector } from './db.js';

/**
 * Perform semantic search on notes
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @param {string} notebookId - Optional notebook filter
 * @returns {Promise<Array>} - Array of matching notes with scores
 */
export async function semanticSearch(query, topK = 5, notebookId = null) {
  // Generate embedding for the query
  const queryVector = await generateEmbedding(query);

  // Search notes by vector similarity
  const results = await searchNotesByVector(queryVector, topK, notebookId);

  return results.map(note => ({
    noteId: note.id,
    noteTitle: note.title,
    notebookId: note.notebookId,
    text: note.content,
    tags: note.tags,
    score: note.score
  }));
}

/**
 * Build RAG context from search results
 * @param {string} question - User's question
 * @param {number} topK - Number of sources to include
 * @param {string} notebookId - Optional notebook filter
 * @returns {Promise<object>} - Context object with sources
 */
export async function buildRAGContext(question, topK = 5, notebookId = null) {
  const searchResults = await semanticSearch(question, topK, notebookId);

  if (searchResults.length === 0) {
    return {
      context: '',
      sources: [],
      hasContext: false
    };
  }

  // Build context string with citations
  const contextParts = searchResults.map((result, index) => {
    const sourceNum = index + 1;
    const tagsStr = result.tags && result.tags.length > 0
      ? ` (Tags: ${result.tags.join(', ')})`
      : '';

    // Truncate content if too long
    const maxContentLength = 1500;
    const content = result.text.length > maxContentLength
      ? result.text.slice(0, maxContentLength) + '...'
      : result.text;

    return `[Source ${sourceNum}: "${result.noteTitle}"${tagsStr}]\n${content}`;
  });

  const context = contextParts.join('\n\n---\n\n');

  const sources = searchResults.map((result, index) => ({
    index: index + 1,
    noteId: result.noteId,
    noteTitle: result.noteTitle,
    notebookId: result.notebookId,
    tags: result.tags,
    score: result.score
  }));

  return {
    context,
    sources,
    hasContext: true
  };
}

/**
 * Format RAG context for AI prompt
 * @param {object} ragContext - Context from buildRAGContext
 * @returns {string} - Formatted system prompt addition
 */
export function formatRAGSystemPrompt(ragContext) {
  if (!ragContext.hasContext) {
    return `The user has no relevant notes for this query. Answer based on your general knowledge.`;
  }

  return `You have access to the user's notes. Use the following sources to answer their question.
When referencing information from the sources, cite them using [1], [2], etc.
If the sources don't contain relevant information, say so clearly.

Sources from user's notes:
${ragContext.context}

---
At the end of your response, include a "Sources:" section listing the notes you referenced.`;
}

/**
 * Format citations for AI response
 * @param {Array} sources - Array of source objects
 * @returns {string} - Formatted citation text
 */
export function formatCitations(sources) {
  if (sources.length === 0) return '';

  const lines = sources.map(source => {
    const tagsStr = source.tags && source.tags.length > 0
      ? ` (${source.tags.join(', ')})`
      : '';
    return `[${source.index}] "${source.noteTitle}"${tagsStr}`;
  });

  return '\n\n---\n**Sources:**\n' + lines.join('\n');
}

/**
 * Extract relevant chunks from note content
 * @param {string} content - Full note content
 * @param {string} query - Search query for relevance scoring
 * @param {number} maxChunks - Maximum number of chunks to return
 * @param {number} chunkSize - Target size of each chunk
 * @returns {Array<string>} - Array of relevant chunks
 */
export function extractRelevantChunks(content, query, maxChunks = 3, chunkSize = 500) {
  if (!content || content.length <= chunkSize) {
    return [content];
  }

  // Split by paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length <= maxChunks) {
    return paragraphs;
  }

  // Score paragraphs by keyword overlap with query
  const queryWords = new Set(
    query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  );

  const scored = paragraphs.map(p => {
    const paragraphWords = p.toLowerCase().split(/\s+/);
    const overlap = paragraphWords.filter(w => queryWords.has(w)).length;
    return { text: p, score: overlap };
  });

  // Sort by score and take top chunks
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxChunks).map(s => s.text);
}

/**
 * Hybrid search combining semantic and keyword search
 * @param {string} query - Search query
 * @param {number} topK - Number of results
 * @param {string} notebookId - Optional notebook filter
 * @returns {Promise<Array>} - Combined search results
 */
export async function hybridSearch(query, topK = 5, notebookId = null) {
  // For now, just use semantic search
  // In the future, could add keyword-based filtering here
  return semanticSearch(query, topK, notebookId);
}
