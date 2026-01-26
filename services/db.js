import lancedb from '@lancedb/lancedb';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

let db = null;
let tables = {};

const EMBEDDING_DIM = 384; // all-MiniLM-L6-v2 dimension

// Table schemas
const schemas = {
  users: {
    id: 'string',
    username: 'string',
    passwordHash: 'string',
    createdAt: 'number',
    updatedAt: 'number'
  },
  notebooks: {
    id: 'string',
    name: 'string',
    emoji: 'string',
    createdAt: 'number',
    updatedAt: 'number'
  },
  notes: {
    id: 'string',
    notebookId: 'string',
    title: 'string',
    content: 'string',
    tags: 'string', // JSON array as string
    favorite: 'number', // 0 or 1
    vector: `fixed_size_list[${EMBEDDING_DIM}]:float32`,
    createdAt: 'number',
    updatedAt: 'number'
  },
  chats: {
    id: 'string',
    noteId: 'string',
    messages: 'string', // JSON array as string
    createdAt: 'number',
    updatedAt: 'number'
  },
  note_versions: {
    id: 'string',
    noteId: 'string',
    title: 'string',
    content: 'string',
    createdAt: 'number'
  }
};

/**
 * Initialize LanceDB connection and create tables if they don't exist
 */
export async function initDatabase(dbPath) {
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  db = await lancedb.connect(dbPath);
  console.log(`LanceDB connected at: ${dbPath}`);

  // Get existing tables
  const existingTables = await db.tableNames();

  // Initialize tables
  for (const tableName of Object.keys(schemas)) {
    if (existingTables.includes(tableName)) {
      tables[tableName] = await db.openTable(tableName);
    }
  }

  return db;
}

/**
 * Get or create a table with initial data
 */
async function getOrCreateTable(tableName, initialData = null) {
  if (tables[tableName]) {
    return tables[tableName];
  }

  const existingTables = await db.tableNames();

  if (existingTables.includes(tableName)) {
    tables[tableName] = await db.openTable(tableName);
    return tables[tableName];
  }

  // Create table with initial data (LanceDB requires at least one row)
  if (initialData) {
    tables[tableName] = await db.createTable(tableName, [initialData]);
    return tables[tableName];
  }

  return null;
}

// ============ Users ============
export async function createUser(userData) {
  const table = await getOrCreateTable('users', userData);
  if (!table) {
    tables['users'] = await db.createTable('users', [userData]);
    return userData;
  }

  await table.add([userData]);
  return userData;
}

export async function getUserByUsername(username) {
  const table = tables['users'];
  if (!table) return null;

  const results = await table.query()
    .where(`username = '${username}'`)
    .limit(1)
    .toArray();

  return results.length > 0 ? results[0] : null;
}

export async function getUserById(id) {
  const table = tables['users'];
  if (!table) return null;

  const results = await table.query()
    .where(`id = '${id}'`)
    .limit(1)
    .toArray();

  return results.length > 0 ? results[0] : null;
}

// ============ Notebooks ============
export async function getAllNotebooks() {
  const table = tables['notebooks'];
  if (!table) return [];

  const results = await table.query().toArray();

  // Deduplicate by ID (in case of data issues)
  const seen = new Set();
  const unique = results.filter(notebook => {
    if (seen.has(notebook.id)) return false;
    seen.add(notebook.id);
    return true;
  });

  return unique.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getNotebookById(id) {
  const table = tables['notebooks'];
  if (!table) return null;

  const results = await table.query()
    .where(`id = '${id}'`)
    .limit(1)
    .toArray();

  return results.length > 0 ? results[0] : null;
}

export async function createNotebook(notebookData) {
  // Check if table exists first without creating
  if (!tables['notebooks']) {
    const existingTables = await db.tableNames();
    if (existingTables.includes('notebooks')) {
      tables['notebooks'] = await db.openTable('notebooks');
    }
  }

  // If table still doesn't exist, create it with the initial data
  if (!tables['notebooks']) {
    tables['notebooks'] = await db.createTable('notebooks', [notebookData]);
    return notebookData;
  }

  // Table exists, just add the new notebook
  await tables['notebooks'].add([notebookData]);
  return notebookData;
}

export async function updateNotebook(id, updates) {
  const table = tables['notebooks'];
  if (!table) return null;

  // LanceDB doesn't have native update, so we need to delete and re-insert
  const existing = await getNotebookById(id);
  if (!existing) return null;

  const updated = { ...existing, ...updates, updatedAt: Date.now() };

  // Delete old record
  await table.delete(`id = '${id}'`);

  // Insert updated record
  await table.add([updated]);

  return updated;
}

export async function deleteNotebook(id) {
  const table = tables['notebooks'];
  if (!table) return false;

  await table.delete(`id = '${id}'`);

  // Also delete related notes
  const notesTable = tables['notes'];
  if (notesTable) {
    await notesTable.delete(`\`notebookId\` = '${id}'`);
  }

  return true;
}

// ============ Notes ============
export async function getAllNotes(notebookId = null) {
  const table = tables['notes'];
  if (!table) return [];

  let query = table.query();
  if (notebookId) {
    query = query.where(`\`notebookId\` = '${notebookId}'`);
  }

  const results = await query.toArray();
  return results
    .map(note => ({
      ...note,
      tags: JSON.parse(note.tags || '[]'),
      favorite: !!note.favorite,
      vector: undefined // Don't send vector to client
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getNoteById(id) {
  const table = tables['notes'];
  if (!table) return null;

  const results = await table.query()
    .where(`id = '${id}'`)
    .limit(1)
    .toArray();

  if (results.length === 0) return null;

  const note = results[0];
  return {
    ...note,
    tags: JSON.parse(note.tags || '[]'),
    favorite: !!note.favorite,
    vector: undefined
  };
}

export async function createNote(noteData, vector = null) {
  const now = Date.now();
  const note = {
    id: noteData.id,
    notebookId: noteData.notebookId || '',
    title: noteData.title || 'Untitled',
    content: noteData.content || '',
    tags: JSON.stringify(noteData.tags || []),
    favorite: noteData.favorite ? 1 : 0,
    vector: vector || new Array(EMBEDDING_DIM).fill(0),
    createdAt: now,
    updatedAt: now
  };

  // Check if table exists first without creating
  if (!tables['notes']) {
    const existingTables = await db.tableNames();
    if (existingTables.includes('notes')) {
      tables['notes'] = await db.openTable('notes');
    }
  }

  // If table still doesn't exist, create it with the initial data
  if (!tables['notes']) {
    tables['notes'] = await db.createTable('notes', [note]);
  } else {
    await tables['notes'].add([note]);
  }

  return {
    ...note,
    tags: JSON.parse(note.tags),
    favorite: !!note.favorite,
    vector: undefined
  };
}

export async function updateNote(id, updates, vector = null) {
  const table = tables['notes'];
  if (!table) return null;

  // Get existing note (with raw data)
  const results = await table.query()
    .where(`id = '${id}'`)
    .limit(1)
    .toArray();

  if (results.length === 0) return null;

  const existing = results[0];

  const updated = {
    ...existing,
    title: updates.title !== undefined ? updates.title : existing.title,
    content: updates.content !== undefined ? updates.content : existing.content,
    tags: updates.tags !== undefined ? JSON.stringify(updates.tags) : existing.tags,
    favorite: updates.favorite !== undefined ? (updates.favorite ? 1 : 0) : existing.favorite,
    notebookId: updates.notebookId !== undefined ? updates.notebookId : existing.notebookId,
    vector: vector || existing.vector,
    updatedAt: Date.now()
  };

  // Delete old record
  await table.delete(`id = '${id}'`);

  // Insert updated record
  await table.add([updated]);

  return {
    ...updated,
    tags: JSON.parse(updated.tags),
    favorite: !!updated.favorite,
    vector: undefined
  };
}

export async function deleteNote(id) {
  const table = tables['notes'];
  if (!table) return false;

  await table.delete(`id = '${id}'`);

  // Also delete related chats and versions
  const chatsTable = tables['chats'];
  if (chatsTable) {
    await chatsTable.delete(`"noteId" = '${id}'`);
  }

  const versionsTable = tables['note_versions'];
  if (versionsTable) {
    await versionsTable.delete(`"noteId" = '${id}'`);
  }

  return true;
}

// ============ Semantic Search ============
export async function searchNotesByVector(queryVector, topK = 5, notebookId = null) {
  const table = tables['notes'];
  if (!table) return [];

  let query = table.search(queryVector).limit(topK);

  // Note: LanceDB vector search filtering may need adjustment based on version
  const results = await query.toArray();

  // Filter by notebookId if specified (post-query filter)
  let filtered = notebookId
    ? results.filter(r => r.notebookId === notebookId)
    : results;

  return filtered.map(note => ({
    id: note.id,
    notebookId: note.notebookId,
    title: note.title,
    content: note.content,
    tags: JSON.parse(note.tags || '[]'),
    score: note._distance !== undefined ? 1 - note._distance : note.score || 0
  }));
}

// ============ Chats ============
export async function getChatsByNoteId(noteId) {
  const table = tables['chats'];
  if (!table) return [];

  const results = await table.query()
    .where(`"noteId" = '${noteId}'`)
    .toArray();

  return results
    .map(chat => ({
      ...chat,
      messages: JSON.parse(chat.messages || '[]')
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllChats() {
  const table = tables['chats'];
  if (!table) return [];

  const results = await table.query().toArray();

  return results
    .map(chat => ({
      ...chat,
      messages: JSON.parse(chat.messages || '[]')
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createChat(chatData) {
  const now = Date.now();
  const chat = {
    id: chatData.id,
    noteId: chatData.noteId || '',
    messages: JSON.stringify(chatData.messages || []),
    createdAt: now,
    updatedAt: now
  };

  const table = await getOrCreateTable('chats', chat);
  if (!table) {
    tables['chats'] = await db.createTable('chats', [chat]);
  } else {
    await table.add([chat]);
  }

  return {
    ...chat,
    messages: JSON.parse(chat.messages)
  };
}

export async function updateChat(id, updates) {
  const table = tables['chats'];
  if (!table) return null;

  const results = await table.query()
    .where(`id = '${id}'`)
    .limit(1)
    .toArray();

  if (results.length === 0) return null;

  const existing = results[0];

  const updated = {
    ...existing,
    messages: updates.messages !== undefined ? JSON.stringify(updates.messages) : existing.messages,
    updatedAt: Date.now()
  };

  await table.delete(`id = '${id}'`);
  await table.add([updated]);

  return {
    ...updated,
    messages: JSON.parse(updated.messages)
  };
}

// ============ Note Versions ============
export async function getVersionsByNoteId(noteId) {
  console.log('getVersionsByNoteId called for:', noteId);

  if (!db) {
    console.error('Database not initialized');
    return [];
  }

  // Ensure table is loaded (may not be in cache on first call)
  if (!tables['note_versions']) {
    const existingTables = await db.tableNames();
    console.log('getVersions: checking tables:', existingTables);
    if (existingTables.includes('note_versions')) {
      tables['note_versions'] = await db.openTable('note_versions');
      console.log('getVersions: opened note_versions table');
    } else {
      console.log('getVersions: note_versions table does not exist yet');
      return [];
    }
  }

  try {
    const allResults = await tables['note_versions'].query().toArray();
    console.log('All versions in table:', allResults.length);

    const filtered = allResults.filter(v => v.noteId === noteId);
    console.log('Filtered for noteId:', noteId, '- found:', filtered.length);

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error querying versions:', error);
    return [];
  }
}

export async function createVersion(versionData) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const now = Date.now();
  const version = {
    id: versionData.id,
    noteId: versionData.noteId,
    title: versionData.title || '',
    content: versionData.content || '',
    createdAt: now
  };

  console.log('createVersion: noteId:', versionData.noteId, 'id:', version.id);

  try {
    // Ensure table exists and is cached
    if (!tables['note_versions']) {
      const existingTables = await db.tableNames();
      if (existingTables.includes('note_versions')) {
        tables['note_versions'] = await db.openTable('note_versions');
        console.log('createVersion: Opened existing table');
      }
    }

    if (!tables['note_versions']) {
      // Create table with first version
      console.log('createVersion: Creating new table');
      tables['note_versions'] = await db.createTable('note_versions', [version]);
    } else {
      // Add to existing cached table
      console.log('createVersion: Adding to existing table');
      await tables['note_versions'].add([version]);
    }

    // Verify immediately using same table reference
    const verify = await tables['note_versions'].query().toArray();
    console.log('createVersion: Table now has', verify.length, 'rows');
    const found = verify.find(v => v.id === version.id);
    console.log('createVersion: New version found:', !!found);

    return version;
  } catch (error) {
    console.error('createVersion error:', error);
    throw error;
  }
}

// Utility to reset note_versions table (call this if data is corrupted)
export async function resetVersionsTable() {
  if (!db) return;

  try {
    const existingTables = await db.tableNames();
    if (existingTables.includes('note_versions')) {
      await db.dropTable('note_versions');
      console.log('Dropped note_versions table');
    }
    tables['note_versions'] = null;
    console.log('Versions table reset complete');
  } catch (error) {
    console.error('Error resetting versions table:', error);
  }
}

// ============ Utility ============
export function getDatabase() {
  return db;
}

export function getTables() {
  return tables;
}

export { EMBEDDING_DIM };
