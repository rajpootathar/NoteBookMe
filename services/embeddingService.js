import { pipeline } from '@xenova/transformers';
import { EMBEDDING_DIM } from './db.js';

let embedder = null;
let isLoading = false;
let loadPromise = null;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

/**
 * Initialize the embedding model
 * Uses singleton pattern to ensure only one model is loaded
 */
export async function initEmbeddings() {
  if (embedder) return embedder;

  if (isLoading) {
    return loadPromise;
  }

  isLoading = true;
  console.log(`Loading embedding model: ${MODEL_NAME}...`);

  loadPromise = (async () => {
    try {
      embedder = await pipeline('feature-extraction', MODEL_NAME, {
        quantized: true // Use quantized model for faster loading
      });
      console.log('Embedding model loaded successfully');
      return embedder;
    } catch (error) {
      console.error('Failed to load embedding model:', error);
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector (384 dimensions)
 */
export async function generateEmbedding(text) {
  if (!embedder) {
    await initEmbeddings();
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Array(EMBEDDING_DIM).fill(0);
  }

  // Truncate very long text to avoid memory issues
  const maxLength = 8192;
  const truncatedText = text.length > maxLength ? text.slice(0, maxLength) : text;

  const output = await embedder(truncatedText, {
    pooling: 'mean',
    normalize: true
  });

  // Convert to regular array
  return Array.from(output.data);
}

/**
 * Generate embeddings for multiple texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateEmbeddings(texts) {
  const embeddings = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }
  return embeddings;
}

/**
 * Generate embedding for a note (combines title and content)
 * @param {object} note - Note object with title and content
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateNoteEmbedding(note) {
  const text = formatNoteForEmbedding(note);
  return generateEmbedding(text);
}

/**
 * Format a note for embedding generation
 * Combines title, content, and tags into a single text
 */
export function formatNoteForEmbedding(note) {
  const parts = [];

  if (note.title && note.title.trim()) {
    parts.push(`Title: ${note.title.trim()}`);
  }

  if (note.content && note.content.trim()) {
    // Strip markdown formatting for better embeddings
    const cleanContent = stripMarkdown(note.content);
    parts.push(cleanContent);
  }

  // Include tags for better semantic matching
  const tags = Array.isArray(note.tags) ? note.tags : (typeof note.tags === 'string' ? JSON.parse(note.tags || '[]') : []);
  if (tags.length > 0) {
    parts.push(`Tags: ${tags.join(', ')}`);
  }

  return parts.join('\n\n');
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text) {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

export { EMBEDDING_DIM };
