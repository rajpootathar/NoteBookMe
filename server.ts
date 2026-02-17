import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { readFile, stat } from 'fs/promises';
import { config } from 'dotenv';

// Get absolute path for dotenv to work regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname_early = dirname(__filename);
config({ path: join(__dirname_early, '.env') });

// Database & Services
import {
  initDatabase,
  getAllNotebooks, getNotebookById, createNotebook, updateNotebook, deleteNotebook,
  getAllNotes, getNoteById, createNote, updateNote, deleteNote,
  getChatsByNoteId, getAllChats, createChat, updateChat,
  getVersionsByNoteId, createVersion
} from './services/db.js';

import { initEmbeddings, generateNoteEmbedding } from './services/embeddingService.js';
import { authenticateUser, generateToken, createAuthMiddleware, initDefaultUser } from './services/authService.js';
import { semanticSearch, hybridSearch, buildRAGContext, formatRAGSystemPrompt, formatCitations } from './services/ragService.js';
import { parseFile } from './services/fileParser.js';
import { noteToPrintHtml, notebookToPrintHtml } from './services/pdfExporter.js';

const __dirname = __dirname_early;

// ============ Configuration ============
const dbPath = process.env.DB_PATH || './data/notebookme.lance';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

// AI Configuration
const AI_API_URL = process.env.AI_API_URL || process.env.VITE_AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY || process.env.VITE_AI_API_KEY;
const AI_MODEL_NAME = process.env.AI_MODEL_NAME || process.env.VITE_AI_MODEL_NAME || 'gpt-3.5-turbo';

// Auth middleware for Bun
const verifyAuth = createAuthMiddleware(jwtSecret);

// ============ Helper Functions ============

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function error(message: string, status = 500, details?: string): Response {
  return json({ error: message, ...(details && { details }) }, status);
}

async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function getPathParam(pathname: string, pattern: string): string | null {
  // Pattern like '/api/notebooks/:id' matches '/api/notebooks/abc123'
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  if (patternParts.length !== pathParts.length) return null;

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      return pathParts[i];
    }
    if (patternParts[i] !== pathParts[i]) return null;
  }
  return null;
}

function matchPath(pathname: string, pattern: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  if (patternParts.length !== pathParts.length) return false;

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue;
    if (patternParts[i] !== pathParts[i]) return false;
  }
  return true;
}

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain'
};

async function serveStaticFile(filePath: string): Promise<Response | null> {
  try {
    const fullPath = join(__dirname, 'dist', filePath);
    const fileStat = await stat(fullPath);

    if (!fileStat.isFile()) return null;

    const content = await readFile(fullPath);
    const ext = extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    return new Response(content, {
      headers: { 'Content-Type': mimeType }
    });
  } catch {
    return null;
  }
}

// ============ Auth Wrapper ============
interface AuthRequest extends Request {
  user?: { username: string };
}

async function withAuth(
  req: Request,
  handler: (req: AuthRequest) => Promise<Response>
): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error('Unauthorized', 401);
  }

  const token = authHeader.substring(7);

  try {
    const result = verifyAuth(token);
    if (!result.valid) {
      return error('Invalid token', 401);
    }

    const authReq = req as AuthRequest;
    authReq.user = result.user;
    return handler(authReq);
  } catch {
    return error('Token verification failed', 401);
  }
}

// ============ Route Handlers ============

// Auth Routes
async function handleLogin(req: Request): Promise<Response> {
  const { username, password } = await parseBody(req) as { username?: string; password?: string };

  try {
    const user = await authenticateUser(username, password);
    if (user) {
      const token = generateToken({ username: user.username }, jwtSecret!);
      return json({ token, username: user.username });
    }
    return error('Invalid credentials', 401);
  } catch (err) {
    console.error('Login error:', err);
    return error('Login failed');
  }
}

async function handleVerify(req: Request): Promise<Response> {
  return withAuth(req, async (authReq) => {
    return json({ valid: true, username: authReq.user!.username });
  });
}

// Notebook Routes
async function handleGetNotebooks(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const notebooks = await getAllNotebooks();
      return json(notebooks);
    } catch (err) {
      console.error('Get notebooks error:', err);
      return error('Failed to get notebooks');
    }
  });
}

async function handleGetNotebook(req: Request, id: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const notebook = await getNotebookById(id);
      if (!notebook) return error('Not found', 404);
      return json(notebook);
    } catch (err) {
      console.error('Get notebook error:', err);
      return error('Failed to get notebook');
    }
  });
}

async function handleCreateNotebook(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { id, name, emoji } = await parseBody(req) as { id?: string; name?: string; emoji?: string };
      const now = Date.now();
      const notebook = await createNotebook({
        id,
        name,
        emoji: emoji || '📓',
        createdAt: now,
        updatedAt: now
      });
      return json(notebook);
    } catch (err) {
      console.error('Create notebook error:', err);
      return error('Failed to create notebook');
    }
  });
}

async function handleUpdateNotebook(req: Request, id: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { name, emoji } = await parseBody(req) as { name?: string; emoji?: string };
      const notebook = await updateNotebook(id, { name, emoji });
      if (!notebook) return error('Not found', 404);
      return json(notebook);
    } catch (err) {
      console.error('Update notebook error:', err);
      return error('Failed to update notebook');
    }
  });
}

async function handleDeleteNotebook(req: Request, id: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      await deleteNotebook(id);
      return json({ success: true });
    } catch (err) {
      console.error('Delete notebook error:', err);
      return error('Failed to delete notebook');
    }
  });
}

// Note Routes
async function handleGetNotes(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const url = new URL(req.url);
      const notebookId = url.searchParams.get('notebookId');
      const notes = await getAllNotes(notebookId || undefined);
      return json(notes);
    } catch (err) {
      console.error('Get notes error:', err);
      return error('Failed to get notes');
    }
  });
}

async function handleGetNote(req: Request, id: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const note = await getNoteById(id);
      if (!note) return error('Not found', 404);
      return json(note);
    } catch (err) {
      console.error('Get note error:', err);
      return error('Failed to get note');
    }
  });
}

async function handleCreateNote(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { id, notebookId, title, content, tags } = await parseBody(req) as {
        id?: string; notebookId?: string; title?: string; content?: string; tags?: string[];
      };

      const vector = await generateNoteEmbedding({ title, content, tags });

      const note = await createNote({
        id,
        notebookId,
        title: title || 'Untitled',
        content: content || '',
        tags: tags || []
      }, vector);

      return json(note);
    } catch (err) {
      console.error('Create note error:', err);
      return error('Failed to create note');
    }
  });
}

async function handleUpdateNote(req: Request, id: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { title, content, tags, favorite, notebookId } = await parseBody(req) as {
        title?: string; content?: string; tags?: string[]; favorite?: boolean; notebookId?: string;
      };

      let vector = null;
      if (title !== undefined || content !== undefined || tags !== undefined) {
        const currentNote = await getNoteById(id);
        if (currentNote) {
          const noteForEmbedding = {
            title: title !== undefined ? title : currentNote.title,
            content: content !== undefined ? content : currentNote.content,
            tags: tags !== undefined ? tags : currentNote.tags
          };
          vector = await generateNoteEmbedding(noteForEmbedding);
        }
      }

      const note = await updateNote(id, { title, content, tags, favorite, notebookId }, vector);
      if (!note) return error('Not found', 404);
      return json(note);
    } catch (err) {
      console.error('Update note error:', err);
      return error('Failed to update note');
    }
  });
}

async function handleDeleteNote(req: Request, id: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      await deleteNote(id);
      return json({ success: true });
    } catch (err) {
      console.error('Delete note error:', err);
      return error('Failed to delete note');
    }
  });
}

// Note Versions Routes
async function handleGetVersions(req: Request, noteId: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const versions = await getVersionsByNoteId(noteId);
      return json(versions || []);
    } catch (err) {
      console.error('Get versions error:', err);
      return json([]);
    }
  });
}

async function handleCreateVersion(req: Request, noteId: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { id, content, title } = await parseBody(req) as { id?: string; content?: string; title?: string };
      console.log('Creating version for note:', noteId);
      const version = await createVersion({
        id,
        noteId,
        content: content || '',
        title: title || ''
      });
      console.log('Version created:', version.id);
      return json(version);
    } catch (err: unknown) {
      console.error('Create version error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return error('Failed to create version', 500, message);
    }
  });
}

// Chat Routes
async function handleGetChats(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const url = new URL(req.url);
      const noteId = url.searchParams.get('noteId');
      const chats = noteId ? await getChatsByNoteId(noteId) : await getAllChats();
      return json(chats);
    } catch (err) {
      console.error('Get chats error:', err);
      return error('Failed to get chats');
    }
  });
}

async function handleCreateChat(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { id, noteId, messages } = await parseBody(req) as {
        id?: string; noteId?: string; messages?: unknown[];
      };
      const chat = await createChat({
        id,
        noteId,
        messages: messages || []
      });
      return json(chat);
    } catch (err) {
      console.error('Create chat error:', err);
      return error('Failed to create chat');
    }
  });
}

async function handleUpdateChat(req: Request, id: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { messages } = await parseBody(req) as { messages?: unknown[] };
      const chat = await updateChat(id, { messages });
      if (!chat) return error('Not found', 404);
      return json(chat);
    } catch (err) {
      console.error('Update chat error:', err);
      return error('Failed to update chat');
    }
  });
}

// Search & RAG Routes
async function handleSemanticSearch(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { query, topK = 5, notebookId = null, useHybrid = true } = await parseBody(req) as {
        query?: string; topK?: number; notebookId?: string | null; useHybrid?: boolean;
      };

      if (!query || typeof query !== 'string') {
        return error('Query is required', 400);
      }

      // Use hybrid search by default for better results
      const results = useHybrid
        ? await hybridSearch(query, topK, notebookId)
        : await semanticSearch(query, topK, notebookId);
      return json(results);
    } catch (err) {
      console.error('Semantic search error:', err);
      return error('Semantic search failed');
    }
  });
}

async function handleRAGContext(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const { question, topK = 5, notebookId = null, useHybrid = true, useChunking = false } = await parseBody(req) as {
        question?: string; topK?: number; notebookId?: string | null; useHybrid?: boolean; useChunking?: boolean;
      };

      if (!question || typeof question !== 'string') {
        return error('Question is required', 400);
      }

      const ragContext = await buildRAGContext(question, topK, notebookId, { useHybrid, useChunking });

      return json({
        context: ragContext.context,
        sources: ragContext.sources,
        hasContext: ragContext.hasContext,
        systemPrompt: formatRAGSystemPrompt(ragContext),
        citations: formatCitations(ragContext.sources),
        retrievalMethod: ragContext.retrievalMethod,
        resultCount: ragContext.resultCount
      });
    } catch (err) {
      console.error('RAG context error:', err);
      return error('Failed to build RAG context');
    }
  });
}

// AI Chat Proxy
async function handleAIChat(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      if (!AI_API_URL || !AI_API_KEY) {
        return error('AI not configured. Set AI_API_URL and AI_API_KEY in .env');
      }

      const { messages, options = {} } = await parseBody(req) as {
        messages?: unknown[]; options?: { model?: string; temperature?: number; maxTokens?: number };
      };

      if (!messages || !Array.isArray(messages)) {
        return error('Messages array is required', 400);
      }

      const response = await fetch(`${AI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: options.model || AI_MODEL_NAME,
          messages: messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error:', response.status, errorText);
        return error(`AI API error: ${response.status}`, response.status, errorText);
      }

      const data = await response.json() as { choices: { message: { content: string } }[]; usage: unknown };
      return json({
        content: data.choices[0].message.content,
        usage: data.usage
      });
    } catch (err: unknown) {
      console.error('AI proxy error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return error('AI request failed', 500, message);
    }
  });
}

// AI Suggestion Handler (for inline completions)
async function handleAISuggest(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      if (!AI_API_URL || !AI_API_KEY) {
        return error('AI not configured. Set AI_API_URL and AI_API_KEY in .env');
      }

      const { prompt, maxTokens = 20, context } = await parseBody(req) as {
        prompt?: string;
        maxTokens?: number;
        context?: { paragraph?: string; headings?: string[] };
      };

      if (!prompt || typeof prompt !== 'string') {
        return error('Prompt is required', 400);
      }

      const response = await fetch(`${AI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: AI_MODEL_NAME,
          messages: [
            { role: 'system', content: 'You are a concise writing assistant. Provide only the completion text, no explanations or extra formatting.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: Math.min(maxTokens, 100), // Cap at 100 tokens for safety
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Suggest API error:', response.status, errorText);
        return error(`AI API error: ${response.status}`, response.status);
      }

      const data = await response.json() as { choices: { message: { content: string } }[]; usage: unknown };
      const suggestion = data.choices[0]?.message?.content || '';

      return json({
        suggestion: suggestion.trim(),
        usage: data.usage
      });
    } catch (err: unknown) {
      console.error('AI suggest error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return error('AI suggestion failed', 500, message);
    }
  });
}

// AI Format Handler — restructure imported note content as clean markdown
async function handleAIFormat(req: Request, noteId: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      if (!AI_API_URL || !AI_API_KEY) {
        return error('AI not configured. Set AI_API_URL and AI_API_KEY in .env');
      }

      const note = await getNoteById(noteId);
      if (!note) return error('Note not found', 404);

      const content = (note as { content?: string }).content || '';
      if (!content.trim()) return error('Note has no content to format', 400);

      const aiResponse = await fetch(`${AI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: AI_MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: `You are a document formatting assistant. Your task is to restructure raw text (often extracted from PDFs) into clean, well-organized markdown.

Rules:
- Preserve ALL original content — do not remove, summarize, or rewrite anything
- Fix broken lines and merge fragmented sentences
- Add proper markdown headings (# ## ###) based on document structure
- Format lists as proper markdown lists (- or 1.)
- Wrap code snippets in backtick blocks
- Format tables as markdown tables if detected
- Remove page numbers, headers/footers, and other artifacts
- Ensure proper paragraph spacing
- Do NOT add any content that wasn't in the original
- Output ONLY the formatted markdown, no explanations`
            },
            {
              role: 'user',
              content: `Format this extracted document text as clean markdown:\n\n${content}`
            }
          ],
          temperature: 0.1,
          max_tokens: 4000,
          stream: false
        })
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('AI format error:', aiResponse.status, errText);
        return error('AI formatting failed', 502);
      }

      const data = await aiResponse.json() as { choices: { message: { content: string } }[] };
      const formatted = data.choices[0]?.message?.content || '';

      if (!formatted.trim()) {
        return error('AI returned empty response', 502);
      }

      // Update note with formatted content
      const vector = await generateNoteEmbedding({
        title: (note as { title?: string }).title,
        content: formatted,
        tags: (note as { tags?: string[] }).tags
      });

      const updated = await updateNote(noteId, { content: formatted }, vector);
      return json(updated);
    } catch (err) {
      console.error('AI format error:', err);
      return error('Failed to format note with AI');
    }
  });
}

// File Upload Handler
async function handleUpload(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const formData = await req.formData();
      const notebookId = formData.get('notebookId') as string;
      const files = formData.getAll('files') as File[];

      if (!files || files.length === 0) {
        return error('No files provided', 400);
      }

      const createdNotes: unknown[] = [];

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const parsed = await parseFile(buffer, file.name, file.type);

        const vector = await generateNoteEmbedding({
          title: parsed.title,
          content: parsed.content,
          tags: parsed.tags
        });

        const note = await createNote({
          notebookId: notebookId || undefined,
          title: parsed.title,
          content: parsed.content,
          tags: parsed.tags
        }, vector);

        createdNotes.push(note);
      }

      return json(createdNotes);
    } catch (err) {
      console.error('Upload error:', err);
      return error('Failed to process uploaded files');
    }
  });
}

// Note PDF Export Handler
async function handleNoteExportPdf(req: Request, noteId: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const note = await getNoteById(noteId);
      if (!note) return error('Note not found', 404);

      const html = noteToPrintHtml(note);
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${(note.title || 'note').replace(/[^a-z0-9_\-. ]/gi, '_')}.html"`
        }
      });
    } catch (err) {
      console.error('Note PDF export error:', err);
      return error('Failed to export note');
    }
  });
}

// Notebook PDF Export Handler
async function handleNotebookExportPdf(req: Request, notebookId: string): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const notebook = await getNotebookById(notebookId);
      if (!notebook) return error('Notebook not found', 404);

      const notes = await getAllNotes(notebookId);
      const html = notebookToPrintHtml(notes, notebook.name);

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${(notebook.name || 'notebook').replace(/[^a-z0-9_\-. ]/gi, '_')}.html"`
        }
      });
    } catch (err) {
      console.error('Notebook PDF export error:', err);
      return error('Failed to export notebook');
    }
  });
}

// Export Handler
async function handleExport(req: Request): Promise<Response> {
  return withAuth(req, async () => {
    try {
      const archiver = await import('archiver').then(m => m.default);

      const notebooks = await getAllNotebooks();
      const notes = await getAllNotes();

      const archive = archiver('zip', { zlib: { level: 9 } });

      // Create chunks array to collect data
      const chunks: Uint8Array[] = [];

      // Collect archive data using stream
      archive.on('data', (chunk: Uint8Array) => chunks.push(chunk));

      // Group notes by notebook
      const notesByNotebook: Record<string, { name: string; notes: typeof notes }> = {};
      notebooks.forEach((nb: { id: string; name: string }) => {
        notesByNotebook[nb.id] = { name: nb.name, notes: [] };
      });
      notesByNotebook['uncategorized'] = { name: 'Uncategorized', notes: [] };

      notes.forEach((note: { notebookId?: string; title?: string; tags?: string[]; content?: string }) => {
        const bucket = (note.notebookId && notesByNotebook[note.notebookId])
          ? notesByNotebook[note.notebookId]
          : notesByNotebook['uncategorized'];
        bucket.notes.push(note);
      });

      // Append files to archive
      Object.values(notesByNotebook).forEach(bucket => {
        const folderName = bucket.name.replace(/[^a-z0-9_\-. ]/gi, '_');
        bucket.notes.forEach((note: { title?: string; tags?: string[]; content?: string }) => {
          const tags = Array.isArray(note.tags) ? note.tags : [];
          const fileName = `${(note.title || 'untitled').replace(/[^a-z0-9_\-. ]/gi, '_')}.md`;
          const content = `# ${note.title}\n\n${tags.length > 0 ? 'Tags: ' + tags.join(', ') + '\n\n' : ''}${note.content}`;
          archive.append(content, { name: join(folderName, fileName) });
        });
      });

      // Wait for archive to finalize
      await new Promise<void>((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
        archive.finalize();
      });

      // Combine chunks and return response
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return new Response(result, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="notebookme-export.zip"'
        }
      });
    } catch (err) {
      console.error('Export error:', err);
      return error('Export failed');
    }
  });
}

// ============ Main Router ============
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  // API Routes
  if (pathname.startsWith('/api/')) {
    // Auth routes
    if (pathname === '/api/auth/login' && method === 'POST') {
      return handleLogin(req);
    }
    if (pathname === '/api/auth/verify' && method === 'GET') {
      return handleVerify(req);
    }

    // Notebook routes
    if (pathname === '/api/notebooks' && method === 'GET') {
      return handleGetNotebooks(req);
    }
    if (pathname === '/api/notebooks' && method === 'POST') {
      return handleCreateNotebook(req);
    }
    if (matchPath(pathname, '/api/notebooks/:id') && method === 'GET') {
      const id = getPathParam(pathname, '/api/notebooks/:id')!;
      return handleGetNotebook(req, id);
    }
    if (matchPath(pathname, '/api/notebooks/:id') && method === 'PUT') {
      const id = getPathParam(pathname, '/api/notebooks/:id')!;
      return handleUpdateNotebook(req, id);
    }
    if (matchPath(pathname, '/api/notebooks/:id') && method === 'DELETE') {
      const id = getPathParam(pathname, '/api/notebooks/:id')!;
      return handleDeleteNotebook(req, id);
    }

    // Notebook PDF export route
    if (matchPath(pathname, '/api/notebooks/:id/export/pdf') && method === 'GET') {
      const id = pathname.split('/')[3];
      return handleNotebookExportPdf(req, id);
    }

    // Note export routes (must come before generic note routes)
    if (matchPath(pathname, '/api/notes/:id/export/pdf') && method === 'GET') {
      const id = pathname.split('/')[3];
      return handleNoteExportPdf(req, id);
    }

    // AI format route (must come before generic note routes)
    if (matchPath(pathname, '/api/notes/:id/ai-format') && method === 'POST') {
      const id = pathname.split('/')[3];
      return handleAIFormat(req, id);
    }

    // Note version routes (must come before generic note routes)
    if (matchPath(pathname, '/api/notes/:id/versions') && method === 'GET') {
      const id = pathname.split('/')[3];
      return handleGetVersions(req, id);
    }
    if (matchPath(pathname, '/api/notes/:id/versions') && method === 'POST') {
      const id = pathname.split('/')[3];
      return handleCreateVersion(req, id);
    }

    // Note routes
    if (pathname === '/api/notes' && method === 'GET') {
      return handleGetNotes(req);
    }
    if (pathname === '/api/notes' && method === 'POST') {
      return handleCreateNote(req);
    }
    if (matchPath(pathname, '/api/notes/:id') && method === 'GET') {
      const id = getPathParam(pathname, '/api/notes/:id')!;
      return handleGetNote(req, id);
    }
    if (matchPath(pathname, '/api/notes/:id') && method === 'PUT') {
      const id = getPathParam(pathname, '/api/notes/:id')!;
      return handleUpdateNote(req, id);
    }
    if (matchPath(pathname, '/api/notes/:id') && method === 'DELETE') {
      const id = getPathParam(pathname, '/api/notes/:id')!;
      return handleDeleteNote(req, id);
    }

    // Chat routes
    if (pathname === '/api/chats' && method === 'GET') {
      return handleGetChats(req);
    }
    if (pathname === '/api/chats' && method === 'POST') {
      return handleCreateChat(req);
    }
    if (matchPath(pathname, '/api/chats/:id') && method === 'PUT') {
      const id = getPathParam(pathname, '/api/chats/:id')!;
      return handleUpdateChat(req, id);
    }

    // Search & RAG routes
    if (pathname === '/api/search/semantic' && method === 'POST') {
      return handleSemanticSearch(req);
    }
    if (pathname === '/api/ai/rag' && method === 'POST') {
      return handleRAGContext(req);
    }
    if (pathname === '/api/ai/chat' && method === 'POST') {
      return handleAIChat(req);
    }
    if (pathname === '/api/ai/suggest' && method === 'POST') {
      return handleAISuggest(req);
    }

    // File upload route
    if (pathname === '/api/upload' && method === 'POST') {
      return handleUpload(req);
    }

    // Export route
    if (pathname === '/api/export' && method === 'GET') {
      return handleExport(req);
    }

    // API route not found
    return error('Not found', 404);
  }

  // Static file serving
  const staticFile = await serveStaticFile(pathname === '/' ? 'index.html' : pathname.slice(1));
  if (staticFile) return staticFile;

  // SPA fallback - serve index.html for all non-API routes
  const indexFile = await serveStaticFile('index.html');
  if (indexFile) return indexFile;

  return error('Not found', 404);
}

// ============ Server Startup ============
async function startServer() {
  try {
    console.log('Initializing NotebookME server...');

    // Initialize LanceDB
    console.log(`Connecting to LanceDB at: ${dbPath}`);
    await initDatabase(dbPath);

    // Initialize embedding model (lazy load enabled - will load on first use)
    console.log('Embedding model: lazy loading enabled (loads on first use)');
    await initEmbeddings();

    // Initialize default user
    await initDefaultUser();

    // Start Bun server
    const PORT = process.env.PORT || 3000;

    const server = Bun.serve({
      port: Number(PORT),
      fetch: handleRequest
    });

    console.log('');
    console.log('='.repeat(50));
    console.log(`NotebookME server running on port ${server.port}`);
    console.log(`Database: ${dbPath}`);
    console.log(`RAG: Enabled (all-MiniLM-L6-v2, lazy load)`);
    console.log(`Runtime: Bun ${Bun.version}`);
    console.log('='.repeat(50));
    console.log('');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
