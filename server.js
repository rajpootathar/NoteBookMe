import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
import { semanticSearch, buildRAGContext, formatRAGSystemPrompt, formatCitations } from './services/ragService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// ============ Configuration ============
const dbPath = process.env.DB_PATH || './data/notebookme.lance';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

// Auth middleware
const authMiddleware = createAuthMiddleware(jwtSecret);

// ============ Auth Routes ============
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authenticateUser(username, password);
    if (user) {
      const token = generateToken({ username: user.username }, jwtSecret);
      return res.json({ token, username: user.username });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// ============ Notebooks API ============
app.get('/api/notebooks', authMiddleware, async (req, res) => {
  try {
    const notebooks = await getAllNotebooks();
    res.json(notebooks);
  } catch (error) {
    console.error('Get notebooks error:', error);
    res.status(500).json({ error: 'Failed to get notebooks' });
  }
});

app.get('/api/notebooks/:id', authMiddleware, async (req, res) => {
  try {
    const notebook = await getNotebookById(req.params.id);
    if (!notebook) return res.status(404).json({ error: 'Not found' });
    res.json(notebook);
  } catch (error) {
    console.error('Get notebook error:', error);
    res.status(500).json({ error: 'Failed to get notebook' });
  }
});

app.post('/api/notebooks', authMiddleware, async (req, res) => {
  try {
    const { id, name, emoji } = req.body;
    const now = Date.now();
    const notebook = await createNotebook({
      id,
      name,
      emoji: emoji || '📓',
      createdAt: now,
      updatedAt: now
    });
    res.json(notebook);
  } catch (error) {
    console.error('Create notebook error:', error);
    res.status(500).json({ error: 'Failed to create notebook' });
  }
});

app.put('/api/notebooks/:id', authMiddleware, async (req, res) => {
  try {
    const { name, emoji } = req.body;
    const notebook = await updateNotebook(req.params.id, { name, emoji });
    if (!notebook) return res.status(404).json({ error: 'Not found' });
    res.json(notebook);
  } catch (error) {
    console.error('Update notebook error:', error);
    res.status(500).json({ error: 'Failed to update notebook' });
  }
});

app.delete('/api/notebooks/:id', authMiddleware, async (req, res) => {
  try {
    await deleteNotebook(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notebook error:', error);
    res.status(500).json({ error: 'Failed to delete notebook' });
  }
});

// ============ Notes API ============
app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const { notebookId } = req.query;
    const notes = await getAllNotes(notebookId);
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

app.get('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await getNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to get note' });
  }
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  try {
    const { id, notebookId, title, content, tags } = req.body;

    // Generate embedding for the note
    const vector = await generateNoteEmbedding({ title, content, tags });

    const note = await createNote({
      id,
      notebookId,
      title: title || 'Untitled',
      content: content || '',
      tags: tags || []
    }, vector);

    res.json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, favorite, notebookId } = req.body;

    // Generate new embedding if content changed
    let vector = null;
    if (title !== undefined || content !== undefined || tags !== undefined) {
      // Get current note to merge with updates
      const currentNote = await getNoteById(req.params.id);
      if (currentNote) {
        const noteForEmbedding = {
          title: title !== undefined ? title : currentNote.title,
          content: content !== undefined ? content : currentNote.content,
          tags: tags !== undefined ? tags : currentNote.tags
        };
        vector = await generateNoteEmbedding(noteForEmbedding);
      }
    }

    const note = await updateNote(req.params.id, {
      title, content, tags, favorite, notebookId
    }, vector);

    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    await deleteNote(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ============ Note Versions API ============
app.get('/api/notes/:id/versions', authMiddleware, async (req, res) => {
  try {
    const versions = await getVersionsByNoteId(req.params.id);
    res.json(versions || []);
  } catch (error) {
    console.error('Get versions error:', error);
    // Return empty array instead of error for better UX
    res.json([]);
  }
});

app.post('/api/notes/:id/versions', authMiddleware, async (req, res) => {
  try {
    const { id, content, title } = req.body;
    console.log('Creating version for note:', req.params.id);
    const version = await createVersion({
      id,
      noteId: req.params.id,
      content: content || '',
      title: title || ''
    });
    console.log('Version created:', version.id);
    res.json(version);
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({ error: 'Failed to create version', details: error.message });
  }
});

// ============ Chats API ============
app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    const { noteId } = req.query;
    let chats;
    if (noteId) {
      chats = await getChatsByNoteId(noteId);
    } else {
      chats = await getAllChats();
    }
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

app.post('/api/chats', authMiddleware, async (req, res) => {
  try {
    const { id, noteId, messages } = req.body;
    const chat = await createChat({
      id,
      noteId,
      messages: messages || []
    });
    res.json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

app.put('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    const chat = await updateChat(req.params.id, { messages });
    if (!chat) return res.status(404).json({ error: 'Not found' });
    res.json(chat);
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// ============ RAG / Semantic Search API ============
app.post('/api/search/semantic', authMiddleware, async (req, res) => {
  try {
    const { query, topK = 5, notebookId = null } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await semanticSearch(query, topK, notebookId);
    res.json(results);
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ error: 'Semantic search failed' });
  }
});

app.post('/api/ai/rag', authMiddleware, async (req, res) => {
  try {
    const { question, topK = 5, notebookId = null } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ragContext = await buildRAGContext(question, topK, notebookId);

    res.json({
      context: ragContext.context,
      sources: ragContext.sources,
      hasContext: ragContext.hasContext,
      systemPrompt: formatRAGSystemPrompt(ragContext),
      citations: formatCitations(ragContext.sources)
    });
  } catch (error) {
    console.error('RAG context error:', error);
    res.status(500).json({ error: 'Failed to build RAG context' });
  }
});

// ============ AI Proxy API ============
const AI_API_URL = process.env.AI_API_URL || process.env.VITE_AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY || process.env.VITE_AI_API_KEY;
const AI_MODEL_NAME = process.env.AI_MODEL_NAME || process.env.VITE_AI_MODEL_NAME || 'gpt-3.5-turbo';

app.post('/api/ai/chat', authMiddleware, async (req, res) => {
  try {
    if (!AI_API_URL || !AI_API_KEY) {
      return res.status(500).json({
        error: 'AI not configured. Set AI_API_URL and AI_API_KEY in .env'
      });
    }

    const { messages, options = {} } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
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
      return res.status(response.status).json({
        error: `AI API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json({
      content: data.choices[0].message.content,
      usage: data.usage
    });
  } catch (error) {
    console.error('AI proxy error:', error);
    res.status(500).json({ error: 'AI request failed', details: error.message });
  }
});

// ============ Export API ============
app.get('/api/export', authMiddleware, async (req, res) => {
  try {
    const archiver = await import('archiver').then(m => m.default);

    const notebooks = await getAllNotebooks();
    const notes = await getAllNotes();

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment('notebookme-export.zip');
    archive.pipe(res);

    // Group notes by notebook
    const notesByNotebook = {};
    notebooks.forEach(nb => {
      notesByNotebook[nb.id] = { name: nb.name, notes: [] };
    });
    notesByNotebook['uncategorized'] = { name: 'Uncategorized', notes: [] };

    notes.forEach(note => {
      const bucket = (note.notebookId && notesByNotebook[note.notebookId])
        ? notesByNotebook[note.notebookId]
        : notesByNotebook['uncategorized'];
      bucket.notes.push(note);
    });

    // Append files to archive
    Object.values(notesByNotebook).forEach(bucket => {
      const folderName = bucket.name.replace(/[^a-z0-9_\-\. ]/gi, '_');
      bucket.notes.forEach(note => {
        const tags = Array.isArray(note.tags) ? note.tags : [];
        const fileName = `${(note.title || 'untitled').replace(/[^a-z0-9_\-\. ]/gi, '_')}.md`;
        const content = `# ${note.title}\n\n${tags.length > 0 ? 'Tags: ' + tags.join(', ') + '\n\n' : ''}${note.content}`;
        archive.append(content, { name: join(folderName, fileName) });
      });
    });

    archive.finalize();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ============ Static Files ============
app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  }
});

// ============ Server Startup ============
async function startServer() {
  try {
    console.log('Initializing NotebookME server...');

    // Initialize LanceDB
    console.log(`Connecting to LanceDB at: ${dbPath}`);
    await initDatabase(dbPath);

    // Initialize embedding model
    console.log('Loading embedding model...');
    await initEmbeddings();

    // Initialize default user
    await initDefaultUser();

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`NotebookME server running on port ${PORT}`);
      console.log(`Database: ${dbPath}`);
      console.log(`RAG: Enabled (all-MiniLM-L6-v2)`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
