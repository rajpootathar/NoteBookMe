/**
 * Migration Script: SQLite → LanceDB
 *
 * This script migrates data from the old SQLite database to the new LanceDB database.
 * It generates embeddings for all notes during migration.
 *
 * Usage: node scripts/migrate.js
 *
 * Environment variables:
 *   OLD_DB_PATH - Path to SQLite database (default: ./data/memorynote.db)
 *   NEW_DB_PATH - Path to LanceDB database (default: ./data/notebookme.lance)
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import {
  initDatabase,
  createNotebook,
  createNote,
  createChat,
  createVersion
} from '../services/db.js';
import { initEmbeddings, generateNoteEmbedding } from '../services/embeddingService.js';

const OLD_DB_PATH = process.env.OLD_DB_PATH || './data/memorynote.db';
const NEW_DB_PATH = process.env.NEW_DB_PATH || './data/notebookme.lance';

async function migrate() {
  console.log('='.repeat(60));
  console.log('NotebookME Migration: SQLite → LanceDB');
  console.log('='.repeat(60));
  console.log('');

  // Check if SQLite database exists
  if (!existsSync(OLD_DB_PATH)) {
    console.log(`No existing SQLite database found at: ${OLD_DB_PATH}`);
    console.log('Nothing to migrate. Starting fresh with LanceDB.');
    return;
  }

  console.log(`Source: ${OLD_DB_PATH}`);
  console.log(`Target: ${NEW_DB_PATH}`);
  console.log('');

  // Initialize LanceDB
  console.log('Initializing LanceDB...');
  await initDatabase(NEW_DB_PATH);

  // Initialize embedding model
  console.log('Loading embedding model...');
  await initEmbeddings();
  console.log('');

  // Open SQLite database
  const sqlite = new Database(OLD_DB_PATH, { readonly: true });

  // Migrate notebooks
  console.log('Migrating notebooks...');
  const notebooks = sqlite.prepare('SELECT * FROM notebooks').all();
  let notebookCount = 0;

  for (const notebook of notebooks) {
    try {
      await createNotebook({
        id: notebook.id,
        name: notebook.name,
        emoji: notebook.emoji || '📓',
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt
      });
      notebookCount++;
      process.stdout.write(`\r  Migrated ${notebookCount}/${notebooks.length} notebooks`);
    } catch (error) {
      console.error(`\n  Error migrating notebook ${notebook.id}:`, error.message);
    }
  }
  console.log(`\n  ✓ Migrated ${notebookCount} notebooks`);
  console.log('');

  // Migrate notes with embeddings
  console.log('Migrating notes (generating embeddings)...');
  const notes = sqlite.prepare('SELECT * FROM notes').all();
  let noteCount = 0;

  for (const note of notes) {
    try {
      const tags = JSON.parse(note.tags || '[]');

      // Generate embedding for the note
      const vector = await generateNoteEmbedding({
        title: note.title,
        content: note.content,
        tags
      });

      await createNote({
        id: note.id,
        notebookId: note.notebookId || '',
        title: note.title || 'Untitled',
        content: note.content || '',
        tags,
        favorite: !!note.favorite
      }, vector);

      noteCount++;
      process.stdout.write(`\r  Migrated ${noteCount}/${notes.length} notes`);
    } catch (error) {
      console.error(`\n  Error migrating note ${note.id}:`, error.message);
    }
  }
  console.log(`\n  ✓ Migrated ${noteCount} notes with embeddings`);
  console.log('');

  // Migrate chats
  console.log('Migrating chats...');
  const chats = sqlite.prepare('SELECT * FROM chats').all();
  let chatCount = 0;

  for (const chat of chats) {
    try {
      await createChat({
        id: chat.id,
        noteId: chat.noteId || '',
        messages: JSON.parse(chat.messages || '[]')
      });
      chatCount++;
      process.stdout.write(`\r  Migrated ${chatCount}/${chats.length} chats`);
    } catch (error) {
      console.error(`\n  Error migrating chat ${chat.id}:`, error.message);
    }
  }
  console.log(`\n  ✓ Migrated ${chatCount} chats`);
  console.log('');

  // Migrate note versions
  console.log('Migrating note versions...');
  let versionCount = 0;

  try {
    const versions = sqlite.prepare('SELECT * FROM note_versions').all();

    for (const version of versions) {
      try {
        await createVersion({
          id: version.id,
          noteId: version.noteId,
          title: version.title || '',
          content: version.content || ''
        });
        versionCount++;
        process.stdout.write(`\r  Migrated ${versionCount}/${versions.length} versions`);
      } catch (error) {
        console.error(`\n  Error migrating version ${version.id}:`, error.message);
      }
    }
    console.log(`\n  ✓ Migrated ${versionCount} note versions`);
  } catch (error) {
    console.log('  Note: No versions table found or empty');
  }

  // Close SQLite
  sqlite.close();

  console.log('');
  console.log('='.repeat(60));
  console.log('Migration Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Summary:');
  console.log(`  Notebooks: ${notebookCount}`);
  console.log(`  Notes:     ${noteCount} (with embeddings)`);
  console.log(`  Chats:     ${chatCount}`);
  console.log(`  Versions:  ${versionCount}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Update your .env file: DB_PATH=./data/notebookme.lance');
  console.log('  2. Backup your old database: mv ./data/memorynote.db ./data/memorynote.db.backup');
  console.log('  3. Start the server: npm start');
  console.log('');
}

// Run migration
migrate().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
