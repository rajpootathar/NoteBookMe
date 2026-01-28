import { generateEmbedding } from './embeddingService.js';
import { searchNotesByVector, getAllNotes } from './db.js';

// ============ Query Expansion ============
const SYNONYMS = {
  'create': ['make', 'build', 'generate', 'add', 'new'],
  'delete': ['remove', 'destroy', 'erase', 'clear'],
  'update': ['modify', 'change', 'edit', 'alter'],
  'find': ['search', 'locate', 'discover', 'get'],
  'help': ['assist', 'support', 'guide', 'explain'],
  'fix': ['repair', 'solve', 'resolve', 'debug'],
  'show': ['display', 'present', 'list', 'view'],
  'important': ['critical', 'key', 'essential', 'crucial'],
  'problem': ['issue', 'bug', 'error', 'trouble'],
  'idea': ['concept', 'thought', 'notion', 'plan']
};

/**
 * Expand query with synonyms for better recall
 * @param {string} query - Original query
 * @returns {string} - Expanded query
 */
function expandQuery(query) {
  const words = query.toLowerCase().split(/\s+/);
  const expanded = new Set(words);

  for (const word of words) {
    if (SYNONYMS[word]) {
      // Add first 2 synonyms to avoid over-expansion
      SYNONYMS[word].slice(0, 2).forEach(syn => expanded.add(syn));
    }
  }

  return Array.from(expanded).join(' ');
}

// ============ BM25 Keyword Search ============
/**
 * Calculate BM25 score for keyword matching
 * @param {string} query - Search query
 * @param {string} document - Document text
 * @param {number} avgDocLength - Average document length in corpus
 * @param {number} docCount - Total document count
 * @returns {number} - BM25 score
 */
function calculateBM25(query, document, avgDocLength = 500, docCount = 100) {
  const k1 = 1.5; // Term frequency saturation
  const b = 0.75; // Length normalization

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const docTerms = document.toLowerCase().split(/\s+/);
  const docLength = docTerms.length;

  // Count term frequencies in document
  const termFreq = {};
  docTerms.forEach(term => {
    termFreq[term] = (termFreq[term] || 0) + 1;
  });

  let score = 0;
  for (const term of queryTerms) {
    const tf = termFreq[term] || 0;
    if (tf === 0) continue;

    // Simplified IDF (assuming term appears in ~10% of docs)
    const idf = Math.log((docCount + 0.5) / (docCount * 0.1 + 0.5));

    // BM25 formula
    const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
    score += idf * tfNorm;
  }

  return score;
}

/**
 * Perform keyword search with BM25 scoring
 * @param {string} query - Search query
 * @param {Array} notes - Array of notes to search
 * @param {number} topK - Number of results
 * @returns {Array} - Scored results
 */
function keywordSearch(query, notes, topK = 10) {
  const avgDocLength = notes.reduce((sum, n) => sum + (n.content?.length || 0), 0) / notes.length || 500;

  const scored = notes.map(note => {
    const text = `${note.title || ''} ${note.content || ''} ${(note.tags || []).join(' ')}`;
    const bm25Score = calculateBM25(query, text, avgDocLength, notes.length);
    return { ...note, bm25Score };
  });

  return scored
    .filter(n => n.bm25Score > 0)
    .sort((a, b) => b.bm25Score - a.bm25Score)
    .slice(0, topK);
}

// ============ Note Chunking ============
/**
 * Chunk a note into smaller segments with overlap
 * @param {object} note - Note object
 * @param {number} chunkSize - Target chunk size in characters
 * @param {number} overlap - Overlap between chunks
 * @returns {Array} - Array of chunk objects
 */
function chunkNote(note, chunkSize = 500, overlap = 100) {
  const content = note.content || '';
  if (content.length <= chunkSize) {
    return [{
      noteId: note.id,
      noteTitle: note.title,
      notebookId: note.notebookId,
      tags: note.tags,
      text: content,
      chunkIndex: 0,
      isFullNote: true
    }];
  }

  const chunks = [];
  // Split by paragraphs first
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        noteId: note.id,
        noteTitle: note.title,
        notebookId: note.notebookId,
        tags: note.tags,
        text: currentChunk.trim(),
        chunkIndex: chunkIndex++,
        isFullNote: false
      });
      // Keep overlap from previous chunk
      const words = currentChunk.split(/\s+/);
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + '\n\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  // Add remaining content
  if (currentChunk.trim()) {
    chunks.push({
      noteId: note.id,
      noteTitle: note.title,
      notebookId: note.notebookId,
      tags: note.tags,
      text: currentChunk.trim(),
      chunkIndex: chunkIndex,
      isFullNote: false
    });
  }

  return chunks;
}

// ============ Hybrid Search ============
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
 * Build RAG context from search results with improved retrieval
 * @param {string} question - User's question
 * @param {number} topK - Number of sources to include
 * @param {string} notebookId - Optional notebook filter
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Context object with sources
 */
export async function buildRAGContext(question, topK = 5, notebookId = null, options = {}) {
  const { useChunking = false, useHybrid = true } = options;

  // Use hybrid search for better results
  const searchResults = useHybrid
    ? await hybridSearch(question, topK, notebookId)
    : await semanticSearch(question, topK, notebookId);

  if (searchResults.length === 0) {
    return {
      context: '',
      sources: [],
      hasContext: false,
      retrievalMethod: useHybrid ? 'hybrid' : 'semantic'
    };
  }

  // Build context string with citations
  const contextParts = [];
  const seenNotes = new Set();

  for (let i = 0; i < searchResults.length; i++) {
    const result = searchResults[i];
    const sourceNum = i + 1;

    // Skip if we've already included this note (dedup)
    if (seenNotes.has(result.noteId)) continue;
    seenNotes.add(result.noteId);

    const tagsStr = result.tags && result.tags.length > 0
      ? ` (Tags: ${result.tags.join(', ')})`
      : '';

    // Extract relevant chunks if content is long
    let content = result.text || '';
    if (useChunking && content.length > 800) {
      const chunks = extractRelevantChunks(content, question, 2, 600);
      content = chunks.join('\n\n[...]\n\n');
    } else {
      // Truncate if too long
      const maxContentLength = 1500;
      content = content.length > maxContentLength
        ? content.slice(0, maxContentLength) + '...'
        : content;
    }

    // Add relevance indicator
    const relevanceIndicator = result.score > 0.8 ? ' [High relevance]' :
                               result.score > 0.5 ? ' [Medium relevance]' : '';

    contextParts.push(`[Source ${sourceNum}: "${result.noteTitle}"${tagsStr}${relevanceIndicator}]\n${content}`);
  }

  const context = contextParts.join('\n\n---\n\n');

  const sources = searchResults
    .filter(r => !seenNotes.has(r.noteId) || seenNotes.delete(r.noteId)) // Dedup for sources too
    .map((result, index) => ({
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
    hasContext: true,
    retrievalMethod: useHybrid ? 'hybrid' : 'semantic',
    resultCount: searchResults.length
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
 * Rerank results based on multiple signals
 * @param {Array} results - Array of search results
 * @param {string} query - Original query
 * @returns {Array} - Reranked results
 */
function rerankResults(results, query) {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  return results.map(result => {
    let rerankerScore = result.combinedScore || result.score || 0;

    const text = `${result.noteTitle || ''} ${result.text || ''}`.toLowerCase();

    // Boost for exact phrase match
    if (text.includes(query.toLowerCase())) {
      rerankerScore += 0.3;
    }

    // Boost for title match
    const titleLower = (result.noteTitle || '').toLowerCase();
    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        rerankerScore += 0.15;
      }
    }

    // Boost for tag match
    const tags = (result.tags || []).map(t => t.toLowerCase());
    for (const term of queryTerms) {
      if (tags.some(tag => tag.includes(term))) {
        rerankerScore += 0.1;
      }
    }

    // Penalize very short content
    if ((result.text || '').length < 50) {
      rerankerScore *= 0.8;
    }

    return { ...result, rerankerScore };
  }).sort((a, b) => b.rerankerScore - a.rerankerScore);
}

/**
 * Hybrid search combining semantic and keyword search with reranking
 * @param {string} query - Search query
 * @param {number} topK - Number of results
 * @param {string} notebookId - Optional notebook filter
 * @returns {Promise<Array>} - Combined search results
 */
export async function hybridSearch(query, topK = 5, notebookId = null) {
  // Step 1: Expand query with synonyms
  const expandedQuery = expandQuery(query);
  console.log(`[RAG] Query expansion: "${query}" -> "${expandedQuery}"`);

  // Step 2: Get semantic search results (more than needed for fusion)
  const semanticResults = await semanticSearch(expandedQuery, topK * 2, notebookId);

  // Step 3: Get keyword search results
  let allNotes = await getAllNotes(notebookId);
  const keywordResults = keywordSearch(expandedQuery, allNotes, topK * 2);

  // Step 4: Reciprocal Rank Fusion (RRF) to combine results
  const k = 60; // RRF constant
  const scoreMap = new Map();

  // Add semantic scores with RRF
  semanticResults.forEach((result, rank) => {
    const key = result.noteId;
    const rrfScore = 1 / (k + rank + 1);
    if (!scoreMap.has(key)) {
      scoreMap.set(key, { ...result, semanticRank: rank, semanticScore: result.score, rrfScore: 0 });
    }
    scoreMap.get(key).rrfScore += rrfScore * 0.6; // Weight semantic higher
  });

  // Add keyword scores with RRF
  keywordResults.forEach((result, rank) => {
    const key = result.id;
    const rrfScore = 1 / (k + rank + 1);
    if (!scoreMap.has(key)) {
      scoreMap.set(key, {
        noteId: result.id,
        noteTitle: result.title,
        notebookId: result.notebookId,
        text: result.content,
        tags: result.tags,
        keywordRank: rank,
        bm25Score: result.bm25Score,
        rrfScore: 0
      });
    }
    scoreMap.get(key).rrfScore += rrfScore * 0.4; // Weight keyword lower
    scoreMap.get(key).keywordRank = rank;
    scoreMap.get(key).bm25Score = result.bm25Score;
  });

  // Step 5: Sort by combined RRF score
  let fusedResults = Array.from(scoreMap.values())
    .map(r => ({ ...r, combinedScore: r.rrfScore }))
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK * 2);

  // Step 6: Rerank with additional signals
  const rerankedResults = rerankResults(fusedResults, query);

  console.log(`[RAG] Hybrid search: ${semanticResults.length} semantic + ${keywordResults.length} keyword -> ${rerankedResults.length} fused`);

  return rerankedResults.slice(0, topK).map(r => ({
    noteId: r.noteId,
    noteTitle: r.noteTitle,
    notebookId: r.notebookId,
    text: r.text,
    tags: r.tags,
    score: r.rerankerScore || r.combinedScore
  }));
}
