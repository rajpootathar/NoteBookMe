import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// ============ SQLite Setup ============
const dbPath = process.env.DB_PATH || './data/memorynote.db';
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS notebooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '📓',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    notebookId TEXT,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    favorite INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (notebookId) REFERENCES notebooks(id) ON DELETE CASCADE
  );
  
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    noteId TEXT,
    messages TEXT DEFAULT '[]',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE
  );
  
  CREATE INDEX IF NOT EXISTS idx_notes_notebookId ON notes(notebookId);
  CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(favorite);
  CREATE INDEX IF NOT EXISTS idx_chats_noteId ON chats(noteId);
  
  CREATE TABLE IF NOT EXISTS note_versions (
    id TEXT PRIMARY KEY,
    noteId TEXT NOT NULL,
    content TEXT DEFAULT '',
    title TEXT DEFAULT '',
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_versions_noteId ON note_versions(noteId);
`);

// ============ Auth Middleware ============
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.slice(7);
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ============ Auth Routes ============
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.USER_USERNAME && password === process.env.USER_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.json({ token, username });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
    res.json({ valid: true, username: req.user.username });
});

// ============ Notebooks API ============
app.get('/api/notebooks', authMiddleware, (req, res) => {
    const notebooks = db.prepare('SELECT * FROM notebooks ORDER BY createdAt DESC').all();
    res.json(notebooks);
});

app.get('/api/notebooks/:id', authMiddleware, (req, res) => {
    const notebook = db.prepare('SELECT * FROM notebooks WHERE id = ?').get(req.params.id);
    if (!notebook) return res.status(404).json({ error: 'Not found' });
    res.json(notebook);
});

app.post('/api/notebooks', authMiddleware, (req, res) => {
    const { id, name, emoji } = req.body;
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO notebooks (id, name, emoji, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, emoji || '📓', now, now);
    res.json({ id, name, emoji: emoji || '📓', createdAt: now, updatedAt: now });
});

app.put('/api/notebooks/:id', authMiddleware, (req, res) => {
    const { name, emoji } = req.body;
    const now = Date.now();
    const stmt = db.prepare('UPDATE notebooks SET name = COALESCE(?, name), emoji = COALESCE(?, emoji), updatedAt = ? WHERE id = ?');
    stmt.run(name, emoji, now, req.params.id);
    const notebook = db.prepare('SELECT * FROM notebooks WHERE id = ?').get(req.params.id);
    res.json(notebook);
});

app.delete('/api/notebooks/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM notebooks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ============ Notes API ============
app.get('/api/notes', authMiddleware, (req, res) => {
    const { notebookId } = req.query;
    let notes;
    if (notebookId) {
        notes = db.prepare('SELECT * FROM notes WHERE notebookId = ? ORDER BY updatedAt DESC').all(notebookId);
    } else {
        notes = db.prepare('SELECT * FROM notes ORDER BY updatedAt DESC').all();
    }
    // Parse tags JSON
    notes = notes.map(n => ({ ...n, tags: JSON.parse(n.tags || '[]'), favorite: !!n.favorite }));
    res.json(notes);
});

app.get('/api/notes/:id', authMiddleware, (req, res) => {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json({ ...note, tags: JSON.parse(note.tags || '[]'), favorite: !!note.favorite });
});

app.post('/api/notes', authMiddleware, (req, res) => {
    const { id, notebookId, title, content, tags } = req.body;
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO notes (id, notebookId, title, content, tags, favorite, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?)');
    stmt.run(id, notebookId, title || 'Untitled', content || '', JSON.stringify(tags || []), now, now);
    res.json({ id, notebookId, title: title || 'Untitled', content: content || '', tags: tags || [], favorite: false, createdAt: now, updatedAt: now });
});

app.put('/api/notes/:id', authMiddleware, (req, res) => {
    const { title, content, tags, favorite, notebookId } = req.body;
    const now = Date.now();
    const stmt = db.prepare(`
    UPDATE notes SET 
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      tags = COALESCE(?, tags),
      favorite = COALESCE(?, favorite),
      notebookId = COALESCE(?, notebookId),
      updatedAt = ?
    WHERE id = ?
  `);
    stmt.run(title, content, tags ? JSON.stringify(tags) : null, favorite !== undefined ? (favorite ? 1 : 0) : null, notebookId, now, req.params.id);
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    res.json({ ...note, tags: JSON.parse(note.tags || '[]'), favorite: !!note.favorite });
});

app.delete('/api/notes/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ============ Note Versions API ============
app.get('/api/notes/:id/versions', authMiddleware, (req, res) => {
    const versions = db.prepare('SELECT * FROM note_versions WHERE noteId = ? ORDER BY createdAt DESC').all(req.params.id);
    res.json(versions);
});

app.post('/api/notes/:id/versions', authMiddleware, (req, res) => {
    const { id, content, title } = req.body;
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO note_versions (id, noteId, content, title, createdAt) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, req.params.id, content || '', title || '', now);
    res.json({ id, noteId: req.params.id, content, title, createdAt: now });
});

// ============ Chats API ============
app.get('/api/chats', authMiddleware, (req, res) => {
    const { noteId } = req.query;
    let chats;
    if (noteId) {
        chats = db.prepare('SELECT * FROM chats WHERE noteId = ? ORDER BY createdAt DESC').all(noteId);
    } else {
        chats = db.prepare('SELECT * FROM chats ORDER BY createdAt DESC').all();
    }
    chats = chats.map(c => ({ ...c, messages: JSON.parse(c.messages || '[]') }));
    res.json(chats);
});

app.post('/api/chats', authMiddleware, (req, res) => {
    const { id, noteId, messages } = req.body;
    const now = Date.now();
    const stmt = db.prepare('INSERT INTO chats (id, noteId, messages, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, noteId, JSON.stringify(messages || []), now, now);
    res.json({ id, noteId, messages: messages || [], createdAt: now, updatedAt: now });
});

app.put('/api/chats/:id', authMiddleware, (req, res) => {
    const { messages } = req.body;
    const now = Date.now();
    const stmt = db.prepare('UPDATE chats SET messages = ?, updatedAt = ? WHERE id = ?');
    stmt.run(JSON.stringify(messages), now, req.params.id);
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.id);
    res.json({ ...chat, messages: JSON.parse(chat.messages || '[]') });
});

// ============ Serve Vue Build ============
app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
    }
});

// ============ Start Server ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`NotebookME server running on port ${PORT}`);
    console.log(`Database: ${dbPath}`);
});
